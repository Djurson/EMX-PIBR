package parsing

import (
	"strings"

	"github.com/xuri/excelize/v2"
)

// excelStats counts rows, sheets, and named tables across all worksheets.
func excelStats(path string) (SpreadsheetStats, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return SpreadsheetStats{}, err
	}
	defer f.Close()

	sheets := f.GetSheetList()
	stats := SpreadsheetStats{IsExcel: true, NumberOfSheets: len(sheets)}

	for _, sheet := range sheets {
		rows, err := f.GetRows(sheet)
		if err != nil {
			continue
		}
		n := len(rows)
		if n > 0 {
			n-- // exclude header row
		}
		stats.TotalRows += n

		tables, err := f.GetTables(sheet)
		if err == nil {
			stats.TotalExcelTables += len(tables)
		}
	}

	return stats, nil
}

// excelHeaders returns the first-row cell values of the first worksheet.
func excelHeaders(path string) ([]string, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return []string{}, nil
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return []string{}, nil
	}
	return rows[0], nil
}

// readExcelWorkbook reads every worksheet of an XLSX file into a Workbook.
// The header row of each sheet is detected with splitHeader, since supplier
// sheets often start with blank or title/banner rows above the real headers.
func readExcelWorkbook(path, filename string) (*Workbook, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	names := f.GetSheetList()
	sheets := make([]SheetData, 0, len(names))

	for _, name := range names {
		rows, err := f.GetRows(name)
		if err != nil {
			return nil, err
		}

		headers, data := splitHeader(rows)
		sheets = append(sheets, SheetData{Name: name, Headers: headers, Rows: data})
	}

	return &Workbook{FileName: filename, Sheets: sheets}, nil
}

// headerScanLimit caps how many leading rows splitHeader inspects when locating
// the header row, so it never scans an entire large sheet looking for one.
const headerScanLimit = 50

// minHeaderCells is the fewest non-empty cells a row must have to qualify as
// the header row, which lets splitHeader skip blank and single-cell title rows.
const minHeaderCells = 2

// splitHeader locates the header row and returns it plus the data rows below it.
// The header is the first row with at least minHeaderCells non-empty cells — this
// skips the blank and title/banner rows that precede the real headers in many
// supplier exports, while ignoring stray wide data rows further down. Falls back
// to row 0 when no row qualifies. Returns empty slices for no rows.
func splitHeader(rows [][]string) ([]string, [][]string) {
	if len(rows) == 0 {
		return []string{}, [][]string{}
	}

	scan := min(len(rows), headerScanLimit)

	headerIdx := 0
	for i := range scan {
		if nonEmptyCount(rows[i]) >= minHeaderCells {
			headerIdx = i
			break
		}
	}

	headers := rows[headerIdx]
	data := rows[headerIdx+1:]
	if data == nil {
		data = [][]string{}
	}
	return headers, data
}

// nonEmptyCount returns the number of non-blank cells in a row.
func nonEmptyCount(row []string) int {
	n := 0
	for _, cell := range row {
		if strings.TrimSpace(cell) != "" {
			n++
		}
	}
	return n
}
