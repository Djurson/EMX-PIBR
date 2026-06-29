package parser

import (
	"archive/zip"
	"bytes"
	"encoding/csv"
	"io"
	"os"
	"regexp"
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
