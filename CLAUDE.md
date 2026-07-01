# CLAUDE.md

Guidance for working in this repository. Keep it current: when you change architecture, commands, or conventions, update this file in the same change.

## Project overview

**EMX SPIX** (Supplier Products Importer & Exporter) is an internal desktop app for EMX Racing. It takes a supplier spreadsheet (`.xlsx` / `.csv`) and an **EMX product file**, keeps only the supplier rows for products EMX stocks, downloads those products' images, and renames each image to the matching EMX article number — with minimal manual clicking.

The EMX product file is the source of truth: it pairs each EMX article number with the supplier's corresponding article number. SPIX **joins** the two files on the supplier article number, filtering the supplier's full catalogue down to the products EMX carries. Article numbers are **read from the EMX file, never generated**.

The full plan, milestones, and locked decisions live in [`roadmap.md`](roadmap.md). Read it before non-trivial feature work — it is the source of truth for where the product is headed. [`files/`](files/) holds real supplier example spreadsheets (Bolt, Polisport).

### Pipeline (target)

1. Load the supplier spreadsheet and the EMX product file.
2. Map columns: supplier article number + image URL(s) on the supplier side; EMX article number + supplier article number on the EMX side.
3. Join + filter: keep only supplier rows whose article number appears in the EMX file, tagging each kept row with its EMX article number.
4. Download images for the matched products → rename to the EMX article number.

Later phases (Photoroom systematic look, network "eline" folder, single-purpose import files, AI descriptions) are tracked in [`roadmap.md`](roadmap.md) but are out of current scope.

### Stack

[Wails v2](https://wails.io/): a Go backend compiled into a native binary with a React/TypeScript + Vite + Tailwind + shadcn/ui webview frontend. Ships as a single executable — no runtime dependencies on the target machine.

## Commands

```sh
wails dev              # Full dev env: Go + frontend hot reload, regenerates wailsjs bindings
wails build            # Production binary → build/bin/
go build ./...         # Verify Go compilation (fast check, no frontend)
cd frontend && npx tsc --noEmit   # Typecheck frontend without building
cd frontend && npm run build      # tsc + vite build (frontend only; Wails bindings unavailable)
```

## Architecture

### Go ↔ frontend bridge

Wails exposes exported methods on `App` (in [`app.go`](app.go)) as TypeScript bindings under `frontend/wailsjs/` — **auto-generated, never edit by hand**. They regenerate every `wails dev` run.

**After adding or changing a Go method, run `wails dev` once to regenerate `wailsjs/`** before the frontend can call it.

### File I/O rule

All file reading happens in **Go**. The frontend never reads files directly — the browser `File` API is not used in any active path. Files enter Go by absolute path two ways:

- OS dialog via `runtime.OpenFileDialog` → `OpenSpreadsheet()` (cheap metadata: `SpreadsheetInfo`).
- Native drag-and-drop (`OnFileDrop`) → `OpenSpreadsheetFromPath(path)` (same `SpreadsheetInfo`).

For full data, `LoadProject(supplierPath, emxPath)` parses both files and joins them, returning a `Project` (`parsing.Workbook` per file plus the `Combined`, filtered result). The import screen takes **two** files — the supplier spreadsheet and the EMX product file — routed by `data-drop-zone` (see the drag-and-drop gotcha).

### Parsing (`spreadsheet/parsing`, no Wails dependency)

- **CSV**: `encoding/csv`.
- **XLSX**: [`excelize`](https://github.com/qax-os/excelize) — `OpenFile` + `GetRows`, no manual ZIP/XML.

Files in the package: `parse.go` (public API + CSV/Excel dispatch: `IsCSV`, `GetStats`, `GetHeaders`, `ReadWorkbook`), `csv.go`, `excel.go` (incl. `splitHeader` header-row detection), `types.go` (`SpreadsheetStats`, `SheetData`, `Workbook`).

`splitHeader` picks the header row as the first row with ≥2 non-empty cells, skipping the blank/title/banner rows that precede real headers in supplier exports.

### Frontend: the studio

Flow: import screen (two `SpreadsheetPicker`s in [`App.tsx`](frontend/src/App.tsx)) → studio opens immediately once both file paths are chosen (`App.tsx` gates on `studioOpen`, passes `supplierPath`/`emxPath`). `MappingStudio` calls `LoadProject` itself on mount and shows a loading overlay while the Go backend parses + joins the two files; the same overlay is reused while `ProcessSheet` downloads images. The studio shows the combined (filtered) workbook: sheet rail + read-only grid + a config drawer for column mapping.

Sheet data is typed via `SheetData` ([`lib/workbook.ts`](frontend/src/lib/workbook.ts)), matching the Go `parsing.SheetData` binding field-for-field — no adapter needed, the studio consumes the generated `main.Project`/`main.Workbook` types directly.

## Key files

| Path                                                                      | Responsibility                                                                                                            |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [`app.go`](app.go)                                                        | Wails `App`; bound methods `LoadProject`, `OpenSpreadsheet`, `OpenSpreadsheetFromPath`, `ProcessSheet`; `SpreadsheetInfo` |
| [`main.go`](main.go)                                                      | Wails options; window config; `DragAndDrop.EnableFileDrop`                                                                |
| `spreadsheet/parsing/{parse,csv,excel,types}.go`                          | CSV + XLSX parsing (stats, headers, full workbook); no Wails dependency                                                   |
| `frontend/src/App.tsx`                                                    | Top-level: two-file import screen → studio gate; global `OnFileDrop` drop routing                                         |
| `frontend/src/components/SpreadsheetPicker.tsx`                           | File picker — OS dialog + drag-and-drop; `data-drop-zone` + `variant`                                                     |
| `frontend/src/components/studio/MappingStudio.tsx`                        | Studio workspace orchestrator                                                                                             |
| `frontend/src/components/studio/{SheetRail,MappingGrid,ConfigDrawer}.tsx` | Studio panes                                                                                                              |
| `frontend/src/components/studio/comboboxes/`                              | Searchable single/multi column-mapping comboboxes                                                                         |
| `frontend/src/lib/columnMapping.ts`                                       | EMX field set, `guessMapping`                                                                                             |
| `frontend/src/lib/workbook.ts`                                            | `SheetData` model                                                                                                         |
| `frontend/src/lib/metadata/parsing.ts`                                    | `BuildFileMetaData`, `SpreadsheetStats`                                                                                   |
| `frontend/src/lib/ToastFunctions.tsx`                                     | `ToastError`, `ToastSucess` wrappers                                                                                      |
| `frontend/src/lib/utils.ts`                                               | `cn()` Tailwind class merger                                                                                              |
| `frontend/wailsjs/`                                                       | Auto-generated Wails bindings — do not edit                                                                               |

## Code conventions

### Documentation

All exported functions, interfaces, and interface fields get doc comments. TS uses JSDoc with `@param` / `@returns` on non-obvious signatures:

```ts
/**
 * Builds a display metadata string for a spreadsheet file.
 * @param file - Selected spreadsheet with parsed stats.
 * @returns Dot-separated string, e.g. `"XLSX · 1.2 MB · 4,200 rows · 3 tables"`.
 */
export function BuildFileMetaData(file: SelectedSpreadsheet): string { ... }
```

Go uses standard doc comments (single line above the declaration, no blank line):

```go
// GetStats parses the spreadsheet at path and returns row and structure counts.
func GetStats(path, filename string) (SpreadsheetStats, error) { ... }
```

### Inline comments

Write **no** inline comments unless the reason behind the code is non-obvious. Document _why_, never _what_.

### UI

Use **shadcn/ui** components first. Only drop to raw HTML tags when no shadcn component fits.

### Imports

`@/` alias for everything under `frontend/src/`:

```ts
import { cn } from "@/lib/utils";
import { BuildArticleNumber } from "@/lib/supplierProfile";
```

Relative paths for Wails-generated bindings (they live outside `src/`):

```ts
import { OpenSpreadsheet } from "../../wailsjs/go/main/App";
import { OnFileDrop } from "../../wailsjs/runtime/runtime";
```

## Gotchas

### Drag-and-drop needs an inline CSS variable

Native file drop (Wails) only fires `OnFileDrop` for elements whose CSS variable `--wails-drop-target` equals `drop` (default `CSSDropProperty`). Tailwind classes **cannot** set CSS variables — set it on the element's inline `style`:

```tsx
style={{ "--wails-drop-target": "drop" } as CSSProperties}
```

Register `OnFileDrop(cb, true)` on mount, `OnFileDropOff()` on unmount. The callback receives **absolute paths** — hand them to `OpenSpreadsheetFromPath`, not the browser `File` API.

`OnFileDrop` is **global** — only one handler can be active. With two drop zones (supplier + EMX), register a single handler in `App.tsx` and route by the drop point: `document.elementFromPoint(x, y)?.closest("[data-drop-zone]")` gives the target `variant`. Each `SpreadsheetPicker` only renders `data-drop-zone` + the CSS variable; it does **not** register its own `OnFileDrop`.

### Header-row detection

Supplier sheets often start with blank or title/banner rows before the real header (e.g. Polisport's header is on row 5). `splitHeader` (in `spreadsheet/parsing/excel.go`) treats the first row with ≥2 non-empty cells as the header, not row 0 — taking the first qualifying row, not the widest, so a stray wide data row deeper in the sheet can't be mistaken for the header.

### Dialog / path returns null on cancel or non-spreadsheet

`runtime.OpenFileDialog` returns `("", nil)` on cancel; `OpenSpreadsheetFromPath` returns `(nil, nil)` for an empty path or a non-spreadsheet extension. Guard both sides:

```go
if path == "" {
    return nil, nil
}
```

```ts
const info = await OpenSpreadsheet();
if (!info) return;
```

### `richColors` in Toaster

`main.tsx` mounts `<Toaster richColors closeButton position="top-right" />`. `richColors` applies type-specific icon colours; custom icon colours (e.g. `text-red-300`) still layer on top. Sonner's icon-to-text gap is the CSS var `--toast-icon-margin-end` (set it on the toast `style`, not a margin class on the icon).
