import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SheetRail } from "./SheetRail";
import { MappingGrid } from "./MappingGrid";
import { ConfigDrawer } from "./ConfigDrawer";
import { guessMapping, type ColumnMapping } from "@/lib/columnMapping";
import { Separator } from "@/components/ui/separator";
import { main } from "../../../wailsjs/go/models";

interface MappingStudioProps {
  /** The loaded project, holding the combined (filtered) supplier workbook. */
  project: main.Project;
  /** Called when the user returns to the import screen. */
  onBack: () => void;
}

/**
 * Full-window workspace showing the combined workbook: the supplier sheets
 * filtered to products EMX stocks, each with a prepended EMX article number.
 * Sheet rail (left) + read-only data grid (center).
 */
export function MappingStudio({ project, onBack }: MappingStudioProps) {
  const combined = project.combined;
  const sheets = combined?.sheets ?? [];
  const [activeSheet, setActiveSheet] = useState(0);
  const sheet = sheets[activeSheet];

  const [mapping, setMapping] = useState<ColumnMapping>(() => guessMapping(sheet?.headers ?? []));

  function handleSelectSheet(index: number) {
    setActiveSheet(index);
    setMapping(guessMapping(sheets[index]?.headers ?? []));
  }

  const totalRows = sheets.reduce((sum, s) => sum + s.rows.length, 0);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-2.5">
        <img src="src/assets/images/appicon.png" className="size-8" />
        <div className="leading-tight">
          <h1 className="text-sm font-bold tracking-tight">SPIX - Supplier Products Importer & Exporter</h1>
          <p className="text-xs text-muted-foreground">{combined?.fileName}</p>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onBack}>
          Change file
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-52 shrink-0 flex-col gap-4 overflow-y-auto border-r bg-muted/30 p-2">
          <SheetRail sheets={sheets} active={activeSheet} onSelect={handleSelectSheet} />
          <Separator />
          {sheet && <ConfigDrawer mapping={mapping} onMappingChange={setMapping} headers={sheet.headers} />}
          <Separator />
          <Button size="sm" disabled={!sheet}>
            Process {totalRows} →
          </Button>
        </nav>
        {sheet ? (
          <MappingGrid sheet={sheet} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">No products matched the EMX catalogue. Check that the supplier and EMX files belong to the same supplier.</div>
        )}
      </div>
    </div>
  );
}
