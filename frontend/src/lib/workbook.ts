/**
 * A single worksheet's parsed contents. `rows` excludes the header row.
 */
export interface SheetData {
  /** Sheet/tab name as it appears in the workbook. */
  name: string;
  /** First-row cell values used as column headers. */
  headers: string[];
  /** Data rows, each a cell array aligned to {@link headers}. */
  rows: string[][];
}

/** A parsed workbook: one or more sheets from a single spreadsheet file. */
export interface Workbook {
  /** Source file display name. */
  fileName: string;
  /** Worksheets in the file, in document order. */
  sheets: SheetData[];
}

/**
 * Adapts the Go `OpenWorkbook` binding result into a {@link Workbook}.
 *
 * The Go `spreadsheet.Workbook` struct mirrors this model field-for-field, so
 * the conversion is structural. This is the single adapter point between the
 * generated binding type and the frontend model.
 * @param wb - The workbook returned by the Go `OpenWorkbook` method.
 * @returns A frontend {@link Workbook}.
 */
export function toWorkbook(wb: Workbook): Workbook {
  return {
    fileName: wb.fileName,
    sheets: wb.sheets.map((s) => ({ name: s.name, headers: s.headers ?? [], rows: s.rows ?? [] })),
  };
}
