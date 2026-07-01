// Package logging provides a single structured logger backed by log/slog.
//
// Behaviour is controlled by the LOG_TO_FILE environment variable:
//
//   - LOG_TO_FILE unset / "false" / "0": logs go to stdout. Level: Info.
//
//   - LOG_TO_FILE "true" / "1": logs go to logs/spix.log instead, at Debug
//     level with source file:line attached.
//
// Call Init once at process start (before any logging happens). Init is safe
// to call from main; Log is a package-level singleton.
package logging

import (
	"log"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// Log is initialised to a stdout logger so any code path that logs before
// Init() runs still produces console output rather than panicking on nil.
var Log = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

// logDir is where the log file is written when LOG_TO_FILE is enabled.
const logDir = "logs"

// logFile is where the log file is written, relative to logDir.
const logFile = "spix.log"

var (
	initOnce sync.Once
	openFile *os.File
)

// toFile records whether file logging is currently enabled.
var toFile bool

// ToFile reports whether file logging is currently enabled. Useful for
// callers that want to avoid expensive log payload construction in console
// mode.
func ToFile() bool { return toFile }

// Init configures Log based on the LOG_TO_FILE env var. It is idempotent —
// only the first call has an effect.
func Init() {
	initOnce.Do(func() {
		toFile = parseBool(os.Getenv("LOG_TO_FILE"))

		if !toFile {
			Log = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
			log.Printf("[logging] console mode (set LOG_TO_FILE=true for file logs)")
			return
		}

		if err := os.MkdirAll(logDir, 0o755); err != nil {
			log.Printf("[logging] could not create %s dir, falling back to console: %v", logDir, err)
			toFile = false
			return
		}

		Log = fileLogger(logFile)
		log.Printf("[logging] file mode — writing detailed logs to %s/%s", logDir, logFile)
	})
}

// fileLogger opens (or creates/appends) the log file and returns a
// Debug-level text logger writing to it. On failure it logs the error and
// falls back to a stdout logger so the app keeps running.
func fileLogger(filename string) *slog.Logger {
	path := filepath.Join(logDir, filename)
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		log.Printf("[logging] could not open %s, using stdout: %v", path, err)
		return slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	}
	openFile = f

	// Detailed: include source file:line and Debug level so every input and
	// phase transition is captured.
	h := slog.NewTextHandler(f, &slog.HandlerOptions{
		Level:     slog.LevelDebug,
		AddSource: true,
	})
	return slog.New(h)
}

// Close flushes and closes the log file. Call on graceful shutdown. It is
// safe to call when in console mode (no-op).
func Close() {
	if openFile == nil {
		return
	}
	_ = openFile.Sync()
	_ = openFile.Close()
	openFile = nil
}

func parseBool(v string) bool {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "1", "true", "yes", "on":
		return true
	default:
		return false
	}
}
