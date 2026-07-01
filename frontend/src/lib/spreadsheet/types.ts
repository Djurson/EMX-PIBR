export type FileVariant = "supplier" | "emx";

/**
 * Stable identifiers for the EMX output fields a source column can map to.
 */
export type FieldKey = "emxNumber" | "articleNumber" | "description" | "images" | "manuals";

/** Definition of a single mappable EMX output field. */
export interface FieldDef {
  /** Stable identifier used as the mapping record key. */
  key: FieldKey;
  /** Human-readable label shown in the config drawer. */
  label: string;
  /** Whether a source column must be assigned before continuing. */
  required: boolean;
  /** When true, multiple source columns can be assigned to this field. */
  multi: boolean;
  /** Lowercase substrings used to auto-guess a matching source column. */
  keywords: string[];
}

/**
 * Maps each EMX output field to a chosen source column index (or indices for
 * multi fields), or `null` when unassigned. Indices are 0-based positions into
 * the sheet's header row, so the Go backend can address columns directly and
 * duplicate header names stay distinct. Keys are exhaustive over {@link FieldKey}.
 */
export type ColumnMapping = { [K in FieldKey]: K extends "images" ? number[] : number | null };

export type SpreadsheetStats = {
  /** Number of sheets. `undefined` for CSV (single implicit sheet). */
  numberOfSheets?: number;
  /** Number of named Excel tables. `undefined` for CSV (no table concept). */
  totalExcelTables?: number;
  /** Total data rows across all sheets, excluding the header row. */
  totalRows: number;
};

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
