package combine

import (
	"fmt"
	"strings"

	"spix/spreadsheet/parsing"
)

// emxArticleColumn is the header of the EMX article number column in an EMX file.
const emxArticleColumn = "Artikelkod"

// supplierArticleColumn is the header of the supplier article number column in
// an EMX file — the key SPIX joins the supplier spreadsheet against.
const supplierArticleColumn = "Lev art.kod"

// combinedHeader is the column prepended to every kept supplier sheet, holding
// the EMX article number resolved for that row.
const combinedHeader = "EMX Article Number"

// Combine filters a supplier workbook down to the products present in an EMX
// workbook and returns a new workbook with, per kept sheet, an "EMX Article
// Number" column prepended.
//
// The EMX workbook supplies a lookup from supplier article number (Lev art.kod)
// to EMX article number (Artikelkod). For each supplier sheet, the column whose
// values best match that lookup is taken as the supplier's article number column
// (supplier layouts differ, so the column is detected by data overlap rather than
// header name). Rows whose article number is in the lookup are kept; sheets with
// no matching rows are dropped entirely.
func Combine(supplier, emx *parsing.Workbook) (*parsing.Workbook, error) {
	lookup, err := buildLookup(emx)
	if err != nil {
		return nil, err
	}

	combined := &parsing.Workbook{FileName: supplier.FileName}

	for _, sheet := range supplier.Sheets {
		col := detectArticleColumn(sheet, lookup)
		if col < 0 {
			continue // no products EMX stocks on this sheet
		}

		kept := filterSheet(sheet, col, lookup)
		if len(kept.Rows) == 0 {
			continue
		}
		combined.Sheets = append(combined.Sheets, kept)
	}

	return combined, nil
}

// buildLookup maps each normalized supplier article number (Lev art.kod) to its
// EMX article number (Artikelkod), reading the EMX workbook's single sheet.
func buildLookup(emx *parsing.Workbook) (map[string]string, error) {
	if len(emx.Sheets) == 0 {
		return nil, fmt.Errorf("emx workbook has no sheets")
	}
	sheet := emx.Sheets[0]

	artCol := indexOfHeader(sheet.Headers, emxArticleColumn)
	supCol := indexOfHeader(sheet.Headers, supplierArticleColumn)
	if artCol < 0 || supCol < 0 {
		return nil, fmt.Errorf("emx file missing %q or %q header", emxArticleColumn, supplierArticleColumn)
	}

	lookup := make(map[string]string, len(sheet.Rows))
	for _, row := range sheet.Rows {
		if supCol >= len(row) || artCol >= len(row) {
			continue
		}
		key := normalize(row[supCol])
		if key == "" {
			continue
		}
		lookup[key] = row[artCol]
	}
	return lookup, nil
}

// detectArticleColumn returns the index of the column whose values most overlap
// the lookup keys, or -1 if no column has any match. Empty cells are ignored so
// blank columns cannot win on empty-string matches.
func detectArticleColumn(sheet parsing.SheetData, lookup map[string]string) int {
	width := 0
	for _, row := range sheet.Rows {
		if len(row) > width {
			width = len(row)
		}
	}

	bestCol, bestHits := -1, 0
	for col := 0; col < width; col++ {
		hits := 0
		for _, row := range sheet.Rows {
			if col >= len(row) {
				continue
			}
			v := normalize(row[col])
			if v == "" {
				continue
			}
			if _, ok := lookup[v]; ok {
				hits++
			}
		}
		if hits > bestHits {
			bestHits, bestCol = hits, col
		}
	}
	return bestCol
}

// filterSheet keeps the rows whose article column value is in the lookup and
// prepends the resolved EMX article number as a new leading column.
func filterSheet(sheet parsing.SheetData, col int, lookup map[string]string) parsing.SheetData {
	out := parsing.SheetData{
		Name:    sheet.Name,
		Headers: append([]string{combinedHeader}, sheet.Headers...),
		Rows:    [][]string{},
	}

	for _, row := range sheet.Rows {
		if col >= len(row) {
			continue
		}
		emxNumber, ok := lookup[normalize(row[col])]
		if !ok {
			continue
		}
		out.Rows = append(out.Rows, append([]string{emxNumber}, row...))
	}
	return out
}

// indexOfHeader returns the index of the first header equal to name (after
// trimming), or -1 when absent.
func indexOfHeader(headers []string, name string) int {
	for i, h := range headers {
		if strings.TrimSpace(h) == name {
			return i
		}
	}
	return -1
}

// normalize canonicalizes an article number for matching: trimmed and uppercased.
func normalize(s string) string {
	return strings.ToUpper(strings.TrimSpace(s))
}
