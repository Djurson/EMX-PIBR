package parser

import (
	"archive/zip"
	"bytes"
	"encoding/csv"
	"encoding/xml"
	"io"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// SpreadsheetStats holds row and structure counts for a parsed spreadsheet.
// CSV files populate only TotalRows; Excel files also set NumberOfSheets,
// TotalExcelTables, and IsExcel.
type SpreadsheetStats struct {
	TotalRows        int
	NumberOfSheets   int
	TotalExcelTables int
	IsExcel          bool
}

// worksheetRe matches worksheet XML paths inside an XLSX ZIP archive.
var worksheetRe = regexp.MustCompile(`^xl/worksheets/sheet\d+\.xml$`)

// IsCSV reports whether filename has a .csv extension (case-insensitive).
func IsCSV(filename string) bool {
	return strings.HasSuffix(strings.ToLower(filename), ".csv")
}

// GetStats parses the spreadsheet at path and returns row and structure counts.
// Dispatches to the CSV or Excel parser based on the file extension in filename.
func GetStats(path, filename string) (SpreadsheetStats, error) {
	if IsCSV(filename) {
		return getCsvStats(path)
	}
	return getExcelStats(path)
}

// getCsvStats counts data rows in a CSV file using encoding/csv.
// The first row is assumed to be a header and is excluded from the count.
func getCsvStats(path string) (SpreadsheetStats, error) {
	f, err := os.Open(path)
	if err != nil {
		return SpreadsheetStats{}, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.FieldsPerRecord = -1 // allow variable column count per row
	r.LazyQuotes = true    // tolerate malformed quoting common in exported CSVs

	count := 0
	for {
		_, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return SpreadsheetStats{}, err
		}
		count++
	}

	rows := count
	if rows > 0 {
		rows-- // exclude header row
	}
	return SpreadsheetStats{TotalRows: rows}, nil
}

// GetHeaders returns the first-row (header) cell values of the spreadsheet at
// path. Dispatches to the CSV or Excel parser based on the file extension.
// Returns an empty slice for an empty file.
func GetHeaders(path, filename string) ([]string, error) {
	if IsCSV(filename) {
		return getCsvHeaders(path)
	}
	return getExcelHeaders(path)
}

// getCsvHeaders reads the first record of a CSV file as its header row.
func getCsvHeaders(path string) ([]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.FieldsPerRecord = -1
	r.LazyQuotes = true

	rec, err := r.Read()
	if err == io.EOF {
		return []string{}, nil
	}
	if err != nil {
		return nil, err
	}
	return rec, nil
}

// xlsxSharedStrings mirrors xl/sharedStrings.xml. Each <si> is either a single
// <t> or a sequence of rich-text <r><t> runs that must be concatenated.
type xlsxSharedStrings struct {
	SI []struct {
		T string `xml:"t"`
		R []struct {
			T string `xml:"t"`
		} `xml:"r"`
	} `xml:"si"`
}

// xlsxWorksheet mirrors the sheetData rows of a worksheet XML file.
type xlsxWorksheet struct {
	Rows []struct {
		Cells []struct {
			Ref string `xml:"r,attr"` // e.g. "B1"
			Typ string `xml:"t,attr"` // "s" = shared string, "inlineStr", "str", ""
			V   string `xml:"v"`
			Is  struct {
				T string `xml:"t"`
			} `xml:"is"`
		} `xml:"c"`
	} `xml:"sheetData>row"`
}

// getExcelHeaders extracts the first-row cell values of the lowest-numbered
// worksheet in an XLSX file, resolving shared strings via xl/sharedStrings.xml.
// Cells are placed by their column letter so sparse header rows keep alignment.
func getExcelHeaders(path string) ([]string, error) {
	r, err := zip.OpenReader(path)
	if err != nil {
		return nil, err
	}
	defer r.Close()

	var shared []string
	worksheets := map[string]*zip.File{}

	for _, f := range r.File {
		switch {
		case f.Name == "xl/sharedStrings.xml":
			shared, err = readSharedStrings(f)
			if err != nil {
				return nil, err
			}
		case worksheetRe.MatchString(f.Name):
			worksheets[f.Name] = f
		}
	}
	if len(worksheets) == 0 {
		return []string{}, nil
	}

	names := make([]string, 0, len(worksheets))
	for name := range worksheets {
		names = append(names, name)
	}
	sort.Strings(names) // sheet1.xml < sheet2.xml — take the first

	rc, err := worksheets[names[0]].Open()
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	var ws xlsxWorksheet
	if err := xml.NewDecoder(rc).Decode(&ws); err != nil {
		return nil, err
	}
	if len(ws.Rows) == 0 {
		return []string{}, nil
	}

	first := ws.Rows[0]
	headers := []string{}
	for _, c := range first.Cells {
		col := columnIndex(c.Ref)
		for len(headers) <= col {
			headers = append(headers, "")
		}
		headers[col] = resolveCell(c.Typ, c.V, c.Is.T, shared)
	}
	return headers, nil
}

// readSharedStrings parses xl/sharedStrings.xml into an ordered slice indexed
// by shared-string id. Rich-text runs within an <si> are concatenated.
func readSharedStrings(f *zip.File) ([]string, error) {
	rc, err := f.Open()
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	var sst xlsxSharedStrings
	if err := xml.NewDecoder(rc).Decode(&sst); err != nil {
		return nil, err
	}

	out := make([]string, len(sst.SI))
	for i, si := range sst.SI {
		if len(si.R) > 0 {
			var b strings.Builder
			for _, run := range si.R {
				b.WriteString(run.T)
			}
			out[i] = b.String()
		} else {
			out[i] = si.T
		}
	}
	return out, nil
}

// resolveCell returns a cell's text value, dereferencing shared strings when
// the cell type is "s". Inline ("inlineStr") and direct ("str"/numeric) values
// are returned as-is.
func resolveCell(typ, v, inline string, shared []string) string {
	switch typ {
	case "s":
		idx, err := strconv.Atoi(strings.TrimSpace(v))
		if err != nil || idx < 0 || idx >= len(shared) {
			return ""
		}
		return shared[idx]
	case "inlineStr":
		return inline
	default:
		return v
	}
}

// columnIndex converts a cell reference like "AB12" into a zero-based column
// index (A=0, B=1, ..., Z=25, AA=26). Returns 0 if no column letters present.
func columnIndex(ref string) int {
	col := 0
	for _, ch := range ref {
		if ch < 'A' || ch > 'Z' {
			break
		}
		col = col*26 + int(ch-'A') + 1
	}
	if col == 0 {
		return 0
	}
	return col - 1
}

// getExcelStats counts rows, sheets, and named tables in an XLSX file by
// reading it as a ZIP archive and inspecting the embedded XML directly,
// without a full spreadsheet parser.
//
// Row count:   <row opening tags in each xl/worksheets/sheet*.xml, minus 1 for the header.
// Sheet count: number of worksheet XML files under xl/worksheets/.
// Table count: number of XML files under xl/tables/ — each represents one named table.
func getExcelStats(path string) (SpreadsheetStats, error) {
	r, err := zip.OpenReader(path)
	if err != nil {
		return SpreadsheetStats{}, err
	}
	defer r.Close()

	stats := SpreadsheetStats{IsExcel: true}

	for _, f := range r.File {
		switch {
		case worksheetRe.MatchString(f.Name):
			stats.NumberOfSheets++

			rc, err := f.Open()
			if err != nil {
				continue
			}
			data, err := io.ReadAll(rc)
			rc.Close()
			if err != nil {
				continue
			}

			// Both <row r="1" ...> and a bare <row> are valid XML row forms.
			rowCount := bytes.Count(data, []byte("<row ")) + bytes.Count(data, []byte("<row>"))
			if rowCount > 0 {
				rowCount-- // exclude header row
			}
			stats.TotalRows += rowCount

		case strings.HasPrefix(f.Name, "xl/tables/") && strings.HasSuffix(f.Name, ".xml"):
			stats.TotalExcelTables++
		}
	}

	return stats, nil
}
