package parsing

// SpreadsheetStats holds row and structure counts for a parsed spreadsheet.
// CSV files populate only TotalRows; Excel files also set NumberOfSheets,
// TotalExcelTables, and IsExcel.
type SpreadsheetStats struct {
	TotalRows        int
	NumberOfSheets   int
	TotalExcelTables int
	IsExcel          bool
}

// SheetData holds one worksheet's parsed contents. Rows excludes the header row.
type SheetData struct {
	// Name is the sheet/tab name as it appears in the workbook.
	Name string `json:"name"`
	// Headers are the first-row cell values used as column headers.
	Headers []string `json:"headers"`
	// Rows are the data rows, each a cell slice aligned to Headers.
	Rows [][]string `json:"rows"`
}

// Workbook is a parsed spreadsheet file: one or more sheets.
type Workbook struct {
	// FileName is the source file display name.
	FileName string `json:"fileName"`
	// Sheets are the worksheets in document order.
	Sheets []SheetData `json:"sheets"`
}
