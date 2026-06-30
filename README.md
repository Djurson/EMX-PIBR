# EMX SPIX — Supplier Products Importer & Exporter

Internal desktop tool for EMX Racing. Takes a **supplier spreadsheet** (`.xlsx` / `.csv`) and an **EMX product file**, keeps only the supplier rows for products EMX actually stocks, downloads those products' images, and renames each image to the matching EMX article number.

The EMX product file is the source of truth: it pairs each EMX article number with the supplier's corresponding article number. SPIX joins the two files on the supplier article number, so the supplier's full catalogue is filtered down to just the products EMX carries.

Built with [Wails v2](https://wails.io/) — Go backend, React/TypeScript frontend, shipped as a single native binary.

---

## What it does

1. Load a supplier spreadsheet and the EMX product file.
2. Map the relevant columns in each (supplier article number + image URL on the supplier side; EMX article number + supplier article number on the EMX side).
3. Join + filter: keep only supplier rows whose article number appears in the EMX file, and attach the matching EMX article number to each.
4. Download the images for those products and rename them to the EMX article number.

Later phases (systematic image look, network "eline" folder, single-purpose import files, AI descriptions) are tracked in [`roadmap.md`](roadmap.md) but are out of current scope.

---

## Prerequisites

Install all of the following before cloning the repo.

| Tool          | Version               | Install                                                    |
| ------------- | --------------------- | ---------------------------------------------------------- |
| **Go**        | 1.23+                 | [go.dev/dl](https://go.dev/dl/)                            |
| **Node.js**   | 15+ (LTS recommended) | [nodejs.org](https://nodejs.org/en/download)               |
| **Wails CLI** | v2                    | `go install github.com/wailsapp/wails/v2/cmd/wails@latest` |

Verify your setup:

```sh
go version       # go1.23.x or higher
node --version   # v15.x or higher
wails version    # v2.x
```

---

## Getting started

```sh
git clone <repo-url>
cd spix

# Wails installs frontend deps automatically on first run,
# but you can pre-install them:
cd frontend && npm install && cd ..
```

---

## Development

```sh
wails dev
```

- Hot-reloads frontend changes via Vite
- Exposes a browser-accessible dev server at [localhost:34115](http://localhost:34115) — useful for devtools/debugging Go bindings without the native window

Frontend-only work (no Go changes):

```sh
cd frontend
npm run dev   # plain Vite server, no Go backend
```

---

## Building

```sh
wails build
```

Produces a self-contained binary in `build/bin/`. No runtime dependencies required on the target machine.

| Flag                                  | Effect                                     |
| ------------------------------------- | ------------------------------------------ |
| `wails build -platform windows/amd64` | Cross-compile for Windows from macOS       |
| `wails build -clean`                  | Force clean build                          |
| `wails build -nsis`                   | Generate Windows installer (requires NSIS) |

---

## Project structure

```text
spix/
├── app.go              # Go app struct — exposes methods to the frontend
├── main.go             # Wails entry point
├── spreadsheet/        # Go spreadsheet parsing (parsing/ subpackage)
├── frontend/
│   ├── src/
│   │   ├── components/ # React UI components (shadcn/ui base)
│   │   ├── lib/        # Utilities, toast helpers, workbook model
│   │   └── App.tsx     # Root component
│   ├── package.json
│   └── vite.config.ts
├── build/              # Wails build output and app icons
├── wails.json          # Wails project config
└── go.mod
```

---

## Tech stack

### Backend (Go)

- [Wails v2](https://wails.io/) — bridges Go and the webview frontend
- [excelize](https://github.com/qax-os/excelize) — XLSX parsing (CSV uses stdlib `encoding/csv`)

### Frontend (TypeScript / React)

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- [shadcn/ui](https://ui.shadcn.com/) — component primitives
- [sonner](https://sonner.emilkowal.ski/) — toast notifications

---

## Platform support

| Platform        | Status                | Notes                                     |
| --------------- | --------------------- | ----------------------------------------- |
| macOS           | Primary dev platform  | All devs should be able to build natively |
| Windows 10 / 11 | Primary target        | Test all releases here                    |
| Windows 7       | Partial (best effort) | WebView2 may not be available             |

---

## Planned features

- [ ] Load both the supplier spreadsheet and the EMX product file
- [ ] Column mapping for both files (supplier article number, image URL; EMX article number, supplier article number)
- [ ] Join + filter: supplier rows reduced to products EMX stocks, each tagged with its EMX article number
- [ ] Studio preview of the filtered, matched products
- [ ] Bulk image download for matched products
- [ ] Rename downloaded images to `<EMX article number>` (with a suffix for multiple images per product)
- [ ] Download report (matched, unmatched, downloaded, failed)

---

## Contributing

1. Branch off `main` — use `feature/<short-description>` or `fix/<short-description>`
2. Run `wails dev` and verify changes work end-to-end in the native window
3. Open a PR with a short description of what changed and why

No external CI is configured yet. Manual smoke-test on Windows before merging anything that touches image I/O or file export.
