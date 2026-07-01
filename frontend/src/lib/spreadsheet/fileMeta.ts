import { SelectedSpreadsheet } from "@/components/SpreadsheetPicker";

/**
 * Formats a byte count into a human-readable size string.
 * @param bytes - File size in bytes.
 * @returns Formatted string, e.g. `"1.2 MB"`, `"340.0 KB"`, or `"512 B"`.
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Extracts and uppercases the file extension from a filename.
 * @param name - Full filename including extension.
 * @returns Uppercase extension, e.g. `"XLSX"`, or `"FILE"` if none found.
 */
const fileExt = (name: string): string => name.split(".").pop()?.toUpperCase() ?? "FILE";

/**
 * Builds a display metadata string for a spreadsheet file.
 * Always includes the file type and size. Appends row and table counts
 * when `stats` are provided.
 * @param f - The spreadsheet file.
 * @param stats - Optional parsed stats from `getSpreadsheetStats`.
 * @returns Dot-separated metadata string, e.g. `"XLSX · 1.2 MB · 4,200 rows · 3 tables"`.
 */
export function BuildFileMetaData(file: SelectedSpreadsheet): string {
  const parts = [`${fileExt(file.name)} · ${formatSize(file.size)}`];
  parts.push(`${file.totalRows.toLocaleString()} ${file.totalRows === 1 ? "row" : "rows"}`);
  if (file.isExcel && file.numberOfSheets > 0) {
    parts.push(`${file.numberOfSheets} ${file.numberOfSheets === 1 ? "sheet" : "sheets"}`);
  }
  if (file.isExcel && file.totalExcelTables > 0) {
    parts.push(`${file.totalExcelTables} ${file.totalExcelTables === 1 ? "table" : "tables"}`);
  }
  return parts.join(" · ");
}
