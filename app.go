package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"spix/spreadsheet/combine"
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

// OpenWorkbook parses the spreadsheet at the given absolute path into a full
// Workbook with every sheet's header row and data rows. Called when the user
// enters the Mapping Studio, after the cheaper OpenSpreadsheet metadata pass.
// Returns nil without an error for an empty path or a non-spreadsheet extension.
func (a *App) OpenWorkbook(path string) (*parsing.Workbook, error) {
	if path == "" {
		return nil, nil
	}

	ext := strings.ToLower(filepath.Ext(path))
	if ext != ".xlsx" && ext != ".xls" && ext != ".csv" {
		return nil, nil
	}

	return parsing.ReadWorkbook(path, filepath.Base(path))
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
