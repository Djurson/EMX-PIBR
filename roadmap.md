# SPIX Roadmap

Development roadmap for **EMX SPIX** (Supplier Products Importer & Exporter), reworked around the real workflow and the supplier example files in [files/](files/).

## Goal

Take a supplier spreadsheet plus EMX's own product file, keep only the supplier rows for products EMX stocks, and produce a correctly named image set for those products — with minimal clicking.

1. Load a **supplier spreadsheet** (their full catalogue) and the **EMX product file** (EMX article number ↔ supplier article number).
2. **Join** the two on the supplier article number; **filter** the supplier list down to products EMX carries, tagging each kept row with its EMX article number.
3. Download those products' images and **rename them to the EMX article number**.

The EMX product file is the source of truth for which products matter and what each one's article number is. SPIX does **not** generate article numbers — it reads them from the EMX file.

## Core decisions (locked)

- **Article number** — comes **from the EMX product file**, not generated. The EMX file maps each EMX article number to its supplier article number. No prefix/separator rule.
- **Product selection** — a supplier row is in scope only if its supplier article number matches a row in the EMX file. Everything EMX does not stock is filtered out.
- **Join key** — supplier article number, present in both files (the supplier's own number on the supplier side, the recorded supplier number on the EMX side).
- **Current scope** — image download + rename to EMX article number. Photoroom look, "eline" move, import-file generation, and AI descriptions are future phases.
- **Stack** — existing Wails v2 (Go backend + React/TS frontend).

## Reference: example files

- **PolisportBilder.xlsx** — single sheet. Image URLs in the `DROPBOX PHOTO` column (`polisport.com/downloads/SKU/<sku>.jpg`); supplier article number in `PART #`. Good image + supplier-number source.
- **Bolt International Price List 2026.xlsx** — multi-sheet (`New Products 2026`, `Updated Pricing 2026`, `Updated Images`, `Discontinued`, …); supplier article number in `BOLT PN`, image links in the image columns. Demonstrates multi-sheet supplier files.

The EMX product file (no example committed yet) holds at least two columns: the EMX article number and the corresponding supplier article number.

---

## Milestones

### M0 — Spreadsheet parsing (done)

- [x] Read full row data in Go per sheet → `[][]string` (headers + cells), via `spreadsheet/parsing`.
- [x] Multi-sheet support: list sheets, pick which to work on.
- [x] CSV (`encoding/csv`) + XLSX (`excelize`) cell extraction.
- [x] Header-row detection that skips blank/title/banner rows (`splitHeader`).

**Deliverable:** `ReadWorkbook` returns structured rows for every sheet, bound to the frontend.

### M1 — Two-file load + column mapping

Load both files and map their relevant columns. Supplier layouts differ (Polisport vs Bolt), so mapping is per-import.

- [ ] Import screen takes **two** files: supplier spreadsheet + EMX product file.
- [ ] Supplier column mapping: supplier article number (required), image URL(s) (required, can be multiple columns).
- [ ] EMX column mapping: EMX article number (required), supplier article number (required).
- [ ] Auto-guess mapping by header name for both files.
- [ ] (Later) Save/load mapping presets per supplier.

**Deliverable:** Two parsed workbooks plus a mapping object for each that the join step consumes.

### M2 — Join + filter engine

The heart of the tool. Match the supplier list against the EMX product file.

- [ ] Build a lookup from the EMX file: `supplier article number → EMX article number` (normalize keys: trim, case-fold, strip incidental formatting).
- [ ] For each supplier row, look up its article number; keep the row only on a match, and attach the EMX article number.
- [ ] Report counts: matched, unmatched supplier rows, and EMX entries with no supplier row.
- [ ] Handle duplicate / ambiguous supplier numbers on either side (define precedence, surface conflicts).

**Deliverable:** A filtered, matched product list — only products EMX stocks, each carrying its EMX article number — ready for the studio and image download.

### M3 — Studio: matched-product view

Replace the column-mapping-centric studio with a view of the join result.

- [ ] Show the filtered, matched rows: EMX article number + supplier number + image column(s).
- [ ] Surface match stats (X of Y supplier rows matched) and let the user spot unmatched products.
- [ ] Select which matched products to process (default: all).

**Deliverable:** A studio that shows what will actually be processed and lets the user confirm before running.

### M4 — Image download + rename

- [ ] Download each matched product's image URL(s) to a temp folder (Go `net/http`, concurrent worker pool + rate limit).
- [ ] Rename to `<EMX article number>` with a numbering suffix for multiple images per product (e.g. `12345_1`, `12345_2`).
- [ ] Robust handling: 404s, timeouts, duplicate URLs, missing extensions, redirects.
- [ ] Progress UI (per-file status, retry failed) + a download report.

**Deliverable:** A temp folder of correctly named images for the matched products, plus a per-run report. This completes the current-scope workflow end-to-end.

---

## Future phases (out of current scope)

Kept for direction; not being built yet.

- **Photoroom systematic look** — background removal + consistent padding/centering/canvas via the Photoroom API.
- **Network "eline" folder** — move processed images to the shared drive, validate reachability, collision strategy.
- **Single-purpose import files** — emit focused Pyramid import files (images, pricing, descriptions, …) per the Bolt sheet split.
- **AI descriptions** — rewrite + translate (EN → SV, human review, then SV → FI + EN) via OpenAI.

---

## Suggested build order

M1 → M2 → M3 → M4 gets the **filter-and-rename image workflow** working end-to-end. The future phases layer on after M4.

## Open questions

1. **EMX file shape:** exact column names for the EMX article number and the supplier article number. A sample EMX product file would pin M1/M2.
2. **Join key format:** do supplier numbers match exactly across both files, or is normalization needed (leading zeros, separators, casing, supplier prefixes)?
3. **Multiple images per product:** what numbering convention (`_1`, `-1`, `.1`)? Is there a "main image"?
4. **Unmatched handling:** should unmatched supplier rows be logged only, or shown for manual matching?
5. **One supplier per run, or many?** Does a single EMX file span multiple suppliers (so the join must be supplier-aware)?
