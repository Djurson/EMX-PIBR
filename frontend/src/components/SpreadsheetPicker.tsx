import { type CSSProperties, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from "@/components/ui/attachment";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { OpenSpreadsheet } from "../../wailsjs/go/main/App";
import { ToastError } from "@/lib/ToastFunctions";
import { BuildFileMetaData } from "@/lib/metadata/parsing";
import { cn } from "@/lib/utils";
import type { FileVariant } from "@/App";

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
  /** First-row cell values, used for column mapping. */
  headers: string[];
}

interface SpreadsheetPickerProps {
  value: SelectedSpreadsheet | null;
  /** Which slot this picker fills — used as the `data-drop-zone` identifier. */
  variant: FileVariant;
  onChange: (variant: FileVariant, file: SelectedSpreadsheet | null) => void;
  /** Whether a file is currently being dragged over this zone. */
  dragging?: boolean;
  disabled?: boolean;
}

/**
 * File picker for spreadsheets. Supports two input methods:
 * - Click to open the native OS file dialog via `OpenSpreadsheet`.
 * - Drag a file from the OS onto the drop zone. Drop routing is handled by the
 *   parent via a single global `OnFileDrop` handler — this component only renders
 *   the `data-drop-zone` attribute and `--wails-drop-target` CSS variable so
 *   Wails knows which elements are valid drop targets.
 */
export function SpreadsheetPicker({ disabled, variant, value, onChange, dragging = false }: SpreadsheetPickerProps) {
  const [loading, setLoading] = useState(false);

  async function handlePick() {
    setLoading(true);
    try {
      const info = await OpenSpreadsheet();
      if (!info) return;
      onChange(variant, {
        name: info.filename,
        path: info.path,
        size: info.size,
        totalRows: info.totalRows,
        isExcel: info.isExcel,
        numberOfSheets: info.numberOfSheets,
        totalExcelTables: info.totalExcelTables,
        headers: info.headers ?? [],
      });
    } catch (err) {
      ToastError("Could not open file", String(err));
    } finally {
      setLoading(false);
    }
  }

  if (value) {
    return (
      <div data-drop-zone={variant} style={{ "--wails-drop-target": "drop" } as CSSProperties}>
        <Attachment state="done">
          <AttachmentMedia>
            <FileSpreadsheet className="size-5" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{value.name}</AttachmentTitle>
            <AttachmentDescription>{BuildFileMetaData(value)}</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove file" onClick={() => onChange(variant, null)}>
              <X className="size-3.5" />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={loading || disabled}
      onClick={handlePick}
      data-drop-zone={variant}
      style={{ "--wails-drop-target": "drop" } as CSSProperties}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-ring hover:bg-muted/50",
      )}>
      <div className={cn("flex size-12 items-center justify-center rounded-full transition-colors", dragging ? "bg-primary/10" : "bg-muted")}>
        <Upload className={cn("size-5 transition-colors", dragging ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {loading ? (
            "Opening…"
          ) : dragging ? (
            "Drop to open"
          ) : (
            <span>
              Click to <span className="text-primary underline underline-offset-2">browse</span> or drag &amp; drop
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
