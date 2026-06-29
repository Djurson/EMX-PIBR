import { useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from "@/components/ui/attachment";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { OpenSpreadsheet } from "../../wailsjs/go/main/App";
import { ToastError } from "@/lib/ToastFunctions";
import { BuildFileMetaData } from "@/lib/metadata/parsing";

/**
 * File metadata and parsed statistics for a spreadsheet opened via the OS dialog.
 * Fields mirror the Go `SpreadsheetInfo` struct returned by `OpenSpreadsheet`.
 */
export interface SelectedSpreadsheet {
  /** Display name of the file (basename only, no directory path). */
  name: string;
  /** Absolute path on disk as reported by the OS dialog. */
  path: string;
  /** File size in bytes. */
  size: number;
  /** Total data rows across all sheets, excluding the header row. */
  totalRows: number;
  /** `true` for .xlsx / .xls files; `false` for CSV. */
  isExcel: boolean;
  /** Number of worksheets. Always 0 for CSV. */
  numberOfSheets: number;
  /** Number of named Excel tables. Always 0 for CSV. */
  totalExcelTables: number;
}

interface SpreadsheetPickerProps {
  value: SelectedSpreadsheet | null;
  onChange: (file: SelectedSpreadsheet | null) => void;
}

/**
 * File picker for spreadsheets that delegates to the native OS dialog via
 * the Wails `OpenSpreadsheet` binding. File stats (rows, tables, sheets) are
 * parsed on the Go side and returned in a single round-trip — no frontend
 * parsing required.
 */
export function SpreadsheetPicker({ value, onChange }: SpreadsheetPickerProps) {
  const [loading, setLoading] = useState(false);

  async function handlePick() {
    setLoading(true);
    try {
      const info = await OpenSpreadsheet();
      if (!info) return; // user cancelled dialog
      onChange({
        name: info.filename,
        path: info.path,
        size: info.size,
        totalRows: info.totalRows,
        isExcel: info.isExcel,
        numberOfSheets: info.numberOfSheets,
        totalExcelTables: info.totalExcelTables,
      });
    } catch (err) {
      console.error(err);
      ToastError("Could not open file", String(err));
    } finally {
      setLoading(false);
    }
  }

  if (value) {
    return (
      <Attachment state="done">
        <AttachmentMedia>
          <FileSpreadsheet className="size-5" />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>{value.name}</AttachmentTitle>
          <AttachmentDescription>{BuildFileMetaData(value)}</AttachmentDescription>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove file" onClick={() => onChange(null)}>
            <X className="size-3.5" />
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handlePick}
      className="flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border-border bg-muted/30 hover:border-ring hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Upload className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {loading ? (
            "Opening…"
          ) : (
            <span>
              Click to <span className="text-primary underline underline-offset-2">browse</span>
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports{" "}
          <KbdGroup>
            <Kbd>.csv</Kbd> and <Kbd>.xlsx</Kbd>
          </KbdGroup>
        </p>
      </div>
    </button>
  );
}
