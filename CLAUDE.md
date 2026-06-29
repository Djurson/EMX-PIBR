# CLAUDE.md

## Project overview

EMX PIBR (Product Image Batcher & Renamer) is an internal desktop application for EMX Racing. It ingests a supplier spreadsheet (`.xlsx` / `.csv`), maps columns to EMX fields, downloads product images, renames them to EMX item numbers, and exports a clean spreadsheet with the renamed image folder.

Built with [Wails v2](https://wails.io/): Go backend compiled into a native binary with a React/TypeScript webview frontend. Shipped as a single executable — no runtime dependencies on the target machine.

---

## Commands

```sh
# Full dev environment (Go + frontend hot reload via Vite)
wails dev

# Production binary → build/bin/
wails build

# Frontend only (no Go backend; Wails bindings unavailable)
cd frontend && npm run dev

# Verify Go compilation
go build ./...
```

---

## Architecture

### Go ↔ Frontend bridge

Wails exposes exported methods on `App` (defined in `app.go`) as TypeScript bindings. The generated bindings live in `frontend/wailsjs/` — **never edit these manually**; they are regenerated every time `wails dev` runs.

**After adding or changing a Go method, run `wails dev` once to regenerate `wailsjs/`.**

### File I/O rule

All file reading happens in Go. The frontend never reads files directly — the browser `File` API is not used in any active production code path. The OS file dialog is opened via `runtime.OpenFileDialog` (Go side), which returns an absolute path that Go then reads.

### Stats parsing

Spreadsheet stats (row count, sheet count, table count) are parsed in Go by `parser/spreadsheet.go` using only the standard library:

- **CSV**: `encoding/csv`
- **XLSX**: `archive/zip` + byte-counting `<row` / `<row>` tags in worksheet XML

---

## Key files

| Path                                            | Responsibility                                               |
| ----------------------------------------------- | ------------------------------------------------------------ |
| `app.go`                                        | Wails `App` struct; all bound Go methods (`OpenSpreadsheet`) |
| `parser/spreadsheet.go`                         | CSV + XLSX stats parsing; no Wails dependency                |
| `frontend/src/components/SpreadsheetPicker.tsx` | Active file picker — triggers OS dialog, displays result     |
| `frontend/src/lib/metadata/parsing.ts`          | `BuildFileMetaData`, `SpreadsheetStats` type                 |
| `frontend/src/lib/utils.ts`                     | `cn()` Tailwind class merger                                 |
| `frontend/src/lib/ToastFunctions.tsx`           | `ToastError`, `ToastSucess` wrappers                         |
| `frontend/src/components/ui/sonner.tsx`         | Toaster component (shadcn wrapper)                           |
| `frontend/wailsjs/`                             | Auto-generated Wails bindings — do not edit                  |

### Deprecated

| Path                                       | Replaced by                                      |
| ------------------------------------------ | ------------------------------------------------ |
| `frontend/src/components/FileUploader.tsx` | `SpreadsheetPicker.tsx`                          |
| `SelectedFile` interface                   | `SelectedSpreadsheet` in `SpreadsheetPicker.tsx` |
| `frontend/src/lib/spreadsheet.ts`          | `parser/spreadsheet.go` (Go-side parsing)        |

---

## Code conventions

### Documentation

All exported functions, interfaces, and interface fields must have JSDoc comments. Use `@param` and `@returns` tags on functions with non-obvious signatures.

```ts
/**
 * Builds a display metadata string for a spreadsheet file.
 * @param file - Selected spreadsheet with parsed stats.
 * @returns Dot-separated string, e.g. `"XLSX · 1.2 MB · 4,200 rows · 3 tables"`.
 */
export function BuildFileMetaData(file: SelectedSpreadsheet): string { ... }
```

Go functions use standard Go doc comments (single line above the declaration, no blank line):

```go
// GetStats parses the spreadsheet at path and returns row and structure counts.
func GetStats(path, filename string) (SpreadsheetStats, error) { ... }
```

### Comments in code

Write **no** inline comments unless the reason behind the code is non-obvious. Do not describe what the code does — only document why, when that would surprise a future reader.

### Imports — frontend path aliases

Use `@/` for all imports under `frontend/src/`:

```ts
import { cn } from "@/lib/utils";
import { ToastError } from "@/lib/ToastFunctions";
import { BuildFileMetaData } from "@/lib/metadata/parsing";
```

Use relative paths for Wails-generated bindings (they live outside `src/`):

```ts
import { OpenSpreadsheet } from "../../wailsjs/go/main/App";
```

---

## Known patterns and gotchas

### Sonner icon spacing

Sonner controls icon-to-text gap via CSS variable `--toast-icon-margin-end` (default `4px`). Adding margin classes to the icon element itself has no effect. Set the variable on the toast `style` prop instead:

```ts
toast.error(message, {
  icon: <CircleX className="text-red-300" />,
  style: { "--toast-icon-margin-end": "8px" } as CSSProperties,
});
```

### XLSX is a ZIP

`.xlsx` files are ZIP archives containing XML. `parser/spreadsheet.go` exploits this directly via `archive/zip` — no third-party spreadsheet library is needed for stats. Row detection uses `<row` / `<row>` byte counting; the first row per sheet is always excluded as a header.

### Wails dialog returns empty string on cancel

`runtime.OpenFileDialog` returns `("", nil)` when the user dismisses the dialog. Always check for an empty path before proceeding:

```go
if path == "" {
    return nil, nil // user cancelled
}
```

On the frontend, `OpenSpreadsheet()` returns `null` on cancel — guard before accessing fields:

```ts
const info = await OpenSpreadsheet();
if (!info) return;
```

### `richColors` in Toaster

`main.tsx` mounts `<Toaster richColors ... />`. The `richColors` prop overrides sonner's default icon colours with type-specific ones. Custom icon colours (e.g. `text-red-300`) set on the icon element still apply on top.
