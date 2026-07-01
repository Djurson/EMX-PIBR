package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"spix/spreadsheet/combine"
	"spix/spreadsheet/images"
	"spix/spreadsheet/parsing"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the main application struct. All exported methods are bound to the
// frontend and callable via the generated wailsjs bindings.
// App holds the loaded project for the current session.
type App struct {
	ctx     context.Context
	project *Project // nil until LoadProject succeeds
}

// Project is a loaded supplier + EMX file pair, parsed and held for the session.
type Project struct {
	SupplierPath string            `json:"supplierPath"`
	EMXPath      string            `json:"emxPath"`
	Combined     *parsing.Workbook `json:"combined"`
}

// ColumnMapping is the frontend field→column-index assignment for a sheet.
// nil pointers mean unassigned; indices are 0-based into the sheet header row.
type ColumnMapping struct {
	EMXNumber     *int  `json:"emxNumber"`
	ArticleNumber *int  `json:"articleNumber"`
	Description   *int  `json:"description"`
	Images        []int `json:"images"`
	Manuals       *int  `json:"manuals"`
}

// SpreadsheetInfo holds file metadata and parsed statistics for a spreadsheet
// selected by the user. Returned by OpenSpreadsheet.
type SpreadsheetInfo struct {
	Path     string `json:"path"`
	Filename string `json:"filename"`
	Size     int64  `json:"size"`

	// Parsed stats — available immediately after OpenSpreadsheet returns.
	TotalRows        int  `json:"totalRows"`
	IsExcel          bool `json:"isExcel"`
	NumberOfSheets   int  `json:"numberOfSheets"`
	TotalExcelTables int  `json:"totalExcelTables"`

	// Headers holds the first-row cell values, used for column mapping.
	Headers []string `json:"headers"`
}

// NewApp creates a new App instance.
func NewApp() *App {
	return &App{}
}

// startup is called by Wails when the application starts.
// The context is required for runtime calls such as dialogs.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// LoadProject parses both files and holds them on the App for the session.
// Returns the parsed project so the frontend can render the studio.
func (a *App) LoadProject(supplierPath, emxPath string) (*Project, error) {
	supplier, err := parsing.ReadWorkbook(supplierPath, filepath.Base(supplierPath))
	if err != nil {
		return nil, fmt.Errorf("supplier file: %w", err)
	}

	emx, err := parsing.ReadWorkbook(emxPath, filepath.Base(emxPath))
	if err != nil {
		return nil, fmt.Errorf("emx file: %w", err)
	}

	combined, err := combine.Combine(supplier, emx)
	if err != nil {
		return nil, fmt.Errorf("combine: %w", err)
	}

	a.project = &Project{
		SupplierPath: supplierPath,
		EMXPath:      emxPath,
		Combined:     combined,
	}
	return a.project, nil
}

// OpenSpreadsheetFromPath parses the spreadsheet at the given absolute path and
// returns its metadata. Used by the drag-and-drop handler, which already has
// the path from the Wails OnFileDrop callback.
func (a *App) OpenSpreadsheetFromPath(path string) (*SpreadsheetInfo, error) {
	if path == "" {
		return nil, nil
	}

	ext := strings.ToLower(filepath.Ext(path))
	if ext != ".xlsx" && ext != ".xls" && ext != ".csv" {
		return nil, nil // silently ignore non-spreadsheet drops
	}

	fi, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	filename := filepath.Base(path)

	stats, err := parsing.GetStats(path, filename)
	if err != nil {
		return nil, err
	}

	headers, err := parsing.GetHeaders(path, filename)
	if err != nil {
		return nil, err
	}

	return &SpreadsheetInfo{
		Path:             path,
		Filename:         filename,
		Size:             fi.Size(),
		TotalRows:        stats.TotalRows,
		IsExcel:          stats.IsExcel,
		NumberOfSheets:   stats.NumberOfSheets,
		TotalExcelTables: stats.TotalExcelTables,
		Headers:          headers,
	}, nil
}

// OpenSpreadsheet opens the OS file picker filtered to spreadsheet formats
// (.xlsx, .xls, .csv), parses the selected file, and returns its metadata
// together with row and structure counts.
// Returns nil without an error if the user cancels the dialog.
func (a *App) OpenSpreadsheet() (*SpreadsheetInfo, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select a spreadsheet",
		Filters: []runtime.FileFilter{
			{DisplayName: "Spreadsheets (*.xlsx, *.xls, *.csv)", Pattern: "*.xlsx;*.xls;*.csv"},
		},
	})
	if err != nil {
		return nil, err
	}
	if path == "" {
		return nil, nil // user cancelled
	}

	fi, err := os.Stat(path)
	if err != nil {
		return nil, err
	}

	filename := filepath.Base(path)

	stats, err := parsing.GetStats(path, filename)
	if err != nil {
		return nil, err
	}

	headers, err := parsing.GetHeaders(path, filename)
	if err != nil {
		return nil, err
	}

	return &SpreadsheetInfo{
		Path:             path,
		Filename:         filename,
		Size:             fi.Size(),
		TotalRows:        stats.TotalRows,
		IsExcel:          stats.IsExcel,
		NumberOfSheets:   stats.NumberOfSheets,
		TotalExcelTables: stats.TotalExcelTables,
		Headers:          headers,
	}, nil
}

// ProcessSheet builds the image download list for one combined sheet from the
// user's column mapping and hands it to DownloadImages.
func (a *App) ProcessSheet(sheetIndex int, mapping ColumnMapping) error {
	if a.project == nil || sheetIndex < 0 || sheetIndex >= len(a.project.Combined.Sheets) {
		return fmt.Errorf("invalid sheet index %d", sheetIndex)
	}
	if mapping.EMXNumber == nil {
		return fmt.Errorf("EMX article number column not mapped")
	}

	imageRows := extractImageRows(a.project.Combined.Sheets[sheetIndex].Rows, mapping)

	wd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("resolve working directory: %w", err)
	}
	outDir := filepath.Join(wd, "downloads")

	return images.DownloadImages(imageRows, outDir)
}

// extractImageRows walks each row, reads the EMX article number and every
// mapped image-column value, and keeps rows that have both.
func extractImageRows(rows [][]string, mapping ColumnMapping) []images.ImageRow {
	emxCol := *mapping.EMXNumber

	imageRows := make([]images.ImageRow, 0, len(rows))
	for _, row := range rows {
		if emxCol >= len(row) {
			continue
		}
		emxNumber := strings.TrimSpace(row[emxCol])
		if emxNumber == "" {
			continue
		}

		urls := make([]string, 0, len(mapping.Images))
		for _, col := range mapping.Images {
			if col >= len(row) {
				continue
			}
			if url := strings.TrimSpace(row[col]); url != "" {
				urls = append(urls, url)
			}
		}
		if len(urls) == 0 {
			continue
		}

		imageRows = append(imageRows, images.ImageRow{EMXArticleNumber: emxNumber, URLs: urls})
	}
	return imageRows
}
