import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SheetData } from "@/lib/spreadsheet/types";

interface SheetRailProps {
  /** Worksheets to list. */
  sheets: SheetData[];
  /** Index of the currently selected sheet. */
  active: number;
  /** Called with the index of a newly selected sheet. */
  onSelect: (index: number) => void;
}

/**
 * Left rail listing the workbook's worksheets. Mirrors a supplier file's
 * per-type sheet split (e.g. Bolt's `Updated Images` / `Updated Pricing`).
 * Selecting an entry loads that sheet's grid.
 */
export function SheetRail({ sheets, active, onSelect }: SheetRailProps) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-0.5 overflow-y-auto">
      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Sheets</p>
      {sheets.map((sheet, i) => {
        const selected = i === active;
        return (
          <Tooltip key={`${sheet.name}-${i}`}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onSelect(i)}
                className={cn("group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors", selected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted")}>
                <span className={cn("h-4 w-0.5 shrink-0 rounded-full transition-colors", selected ? "bg-primary" : "bg-transparent")} />
                <span className="flex-1 truncate">{sheet.name}</span>
                <span className={cn("shrink-0 text-xs tabular-nums", selected ? "text-primary/70" : "text-muted-foreground")}>{sheet.rows.length}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>
                {sheet.name} — {sheet.rows.length} rows
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
