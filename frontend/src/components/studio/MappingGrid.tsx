import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SheetData } from "@/lib/spreadsheet/types";

interface MappingGridProps {
  /** The sheet whose rows and headers are shown. */
  sheet: SheetData;
}

/** Max preview rows rendered; large sheets stay responsive. */
const MAX_PREVIEW_ROWS = 200;

/**
 * Center data grid. Shows the raw spreadsheet data as a read-only preview.
 */
export function MappingGrid({ sheet }: MappingGridProps) {
  const rows = sheet.rows.slice(0, MAX_PREVIEW_ROWS);

  return (
    <div className="flex-1 overflow-auto h-full">
      <Table className="border-collapse text-sm h-full">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            {sheet.headers.map((header, i) => (
              <TableHead key={`${header}-${i}`} className="min-w-24 border-r px-3 py-2 last:border-r-0">
                <span className="block truncate text-xs font-medium" title={header}>
                  {header || `(column ${i + 1})`}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={sheet.headers.length} className="px-3 py-16 text-center text-muted-foreground">
                No row data yet. Row preview arrives with Go row extraction (roadmap M0).
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, r) => (
              <TableRow key={r}>
                {sheet.headers.map((_, c) => (
                  <TableCell key={c} className="border-r px-3 py-1.5 last:border-r-0">
                    <span className="block max-w-60 truncate" title={row[c] ?? ""}>
                      {row[c] ?? ""}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
