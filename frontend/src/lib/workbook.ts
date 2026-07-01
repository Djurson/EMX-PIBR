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
