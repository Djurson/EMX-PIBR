package parsing

import (
	"encoding/csv"
	"io"
	"os"
)

// csvStats counts data rows in a CSV file using encoding/csv.
// The first row is assumed to be a header and is excluded from the count.
func csvStats(path string) (SpreadsheetStats, error) {
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

// csvHeaders reads the first record of a CSV file as its header row.
func csvHeaders(path string) ([]string, error) {
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

// readCSVWorkbook reads a CSV file as a single-sheet workbook. The first record
// is the header row; remaining records are data rows.
func readCSVWorkbook(path, filename string) (*Workbook, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.FieldsPerRecord = -1
	r.LazyQuotes = true

	records, err := r.ReadAll()
	if err != nil {
		return nil, err
	}

	sheet := SheetData{Name: filename, Headers: []string{}, Rows: [][]string{}}
	if len(records) > 0 {
		sheet.Headers = records[0]
		sheet.Rows = records[1:]
	}

	return &Workbook{FileName: filename, Sheets: []SheetData{sheet}}, nil
}
