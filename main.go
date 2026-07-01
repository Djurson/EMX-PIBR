package main

import (
	"context"
	"embed"

	"spix/utils/logging"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	logging.Init()
	defer logging.Close()

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "EMX - SPIX",
		Width:            1200,
		Height:           800,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 255},
		OnStartup:        app.startup,
		OnShutdown:       func(ctx context.Context) { logging.Close() },
		Bind:             []interface{}{app},
		DragAndDrop:      &options.DragAndDrop{EnableFileDrop: true},
		DisableResize:    false,
	})

	if err != nil {
		logging.Log.Error("wails run failed", "err", err)
	}
}
