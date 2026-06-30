package parsing

import "strings"

// IsCSV reports whether filename has a .csv extension (case-insensitive).
func IsCSV(filename string) bool {
	return strings.HasSuffix(strings.ToLower(filename), ".csv")
}

// GetStats parses the spreadsheet at path and returns row and structure counts.
// Dispatches to the CSV or Excel parser based on the file extension in filename.
func GetStats(path, filename string) (SpreadsheetStats, error) {
	if IsCSV(filename) {
		return csvStats(path)
	}
	return excelStats(path)
}

// GetHeaders returns the first-row (header) cell values of the spreadsheet at
// path. Dispatches to the CSV or Excel parser based on the file extension.
// Returns an empty slice for an empty file.
func GetHeaders(path, filename string) ([]string, error) {
	if IsCSV(filename) {
		return csvHeaders(path)
	}
	return excelHeaders(path)
}

// ReadWorkbook parses the spreadsheet at path into a Workbook with full row
// data. Dispatches to the CSV or Excel reader based on the file extension.
func ReadWorkbook(path, filename string) (*Workbook, error) {
	if IsCSV(filename) {
		return readCSVWorkbook(path, filename)
	}
	return readExcelWorkbook(path, filename)
}
