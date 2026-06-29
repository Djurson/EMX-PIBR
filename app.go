package main

import (
	"context"
	"os"
	"path/filepath"
	"pibr/parser"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the main application struct. All exported methods are bound to the
// frontend and callable via the generated wailsjs bindings.
type App struct {
	ctx context.Context
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

	stats, err := parser.GetStats(path, filename)
	if err != nil {
		return nil, err
	}

	headers, err := parser.GetHeaders(path, filename)
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
