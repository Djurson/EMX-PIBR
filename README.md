# EMX PIBR — Product Image Batcher & Renamer

Internal desktop tool for EMX Racing. Ingests a supplier spreadsheet (`.xlsx` / `.csv`), maps columns to EMX fields, downloads product images, renames them to EMX item numbers, and exports a clean spreadsheet alongside the renamed image folder.

Built with [Wails v2](https://wails.io/) — Go backend, React/TypeScript frontend, shipped as a single native binary.

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
cd pibr

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
pibr/
├── app.go              # Go app struct — exposes methods to the frontend
├── main.go             # Wails entry point
├── parser/             # Go packages (spreadsheet parsing, image logic, etc.)
├── frontend/
│   ├── src/
│   │   ├── components/ # React UI components (shadcn/ui base)
│   │   ├── lib/        # Utilities, toast helpers, simple spreadsheet parser
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

### Frontend (TypeScript / React)

- React 19 + TypeScript 6
- Vite 8
- Tailwind CSS v4
- [shadcn/ui](https://ui.shadcn.com/) — component primitives
- [sonner](https://sonner.emilkowal.ski/) — toast notifications
- [exceljs](https://github.com/exceljs/exceljs) — in-browser Excel/CSV parsing

---

## Platform support

| Platform        | Status                | Notes                                     |
| --------------- | --------------------- | ----------------------------------------- |
| macOS           | Primary dev platform  | All devs should be able to build natively |
| Windows 10 / 11 | Primary target        | Test all releases here                    |
| Windows 7       | Partial (best effort) | WebView2 may not be available             |

---

## Planned features

- [ ] Spreadsheet preview with column mapping UI
- [ ] Extract product descriptions and item numbers from mapped columns
- [ ] Define a manufacturer prefix applied to all EMX item numbers
- [ ] Bulk image download from URLs in the spreadsheet
- [ ] Rename images to `<prefix><item-number>` scheme
- [ ] Export cleaned `.xlsx` with EMX item number, manufacturer number, description, image name, and bike fitment
- [ ] Integration with internal Go binary for bike/brand fitment lookup

---

## Contributing

1. Branch off `main` — use `feature/<short-description>` or `fix/<short-description>`
2. Run `wails dev` and verify changes work end-to-end in the native window
3. Open a PR with a short description of what changed and why

No external CI is configured yet. Manual smoke-test on Windows before merging anything that touches image I/O or file export.
