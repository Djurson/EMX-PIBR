import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SheetRail } from "./SheetRail";
import { MappingGrid } from "./MappingGrid";
import { ConfigDrawer } from "./ConfigDrawer";
import { guessMapping, type ColumnMapping } from "@/lib/columnMapping";
import { Separator } from "@/components/ui/separator";
import { main } from "../../../wailsjs/go/models";
import { LoadProject, ProcessSheet } from "../../../wailsjs/go/main/App";
import { ToastError, ToastSucess } from "@/lib/ToastFunctions";
import { ChevronRight, Loader2 } from "lucide-react";

interface MappingStudioProps {
  /** Absolute path to the supplier spreadsheet, chosen on the import screen. */
  supplierPath: string;
  /** Absolute path to the EMX product file, chosen on the import screen. */
  emxPath: string;
  /** Called when the user returns to the import screen. */
  onBack: () => void;
}

/**
 * Full-window workspace showing the combined workbook: the supplier sheets
 * filtered to products EMX stocks, each with a prepended EMX article number.
 * Loads the project itself on mount so the studio can open immediately,
 * covered by a loading overlay while the Go backend joins the two files.
 * Sheet rail (left) + read-only data grid (center).
 */
export function MappingStudio({ supplierPath, emxPath, onBack }: MappingStudioProps) {
  const [project, setProject] = useState<main.Project | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [mapping, setMapping] = useState<ColumnMapping>(() => guessMapping([]));
  const [processing, setProcessing] = useState(true);
  const [loadingTitle, setLoadingTitle] = useState("Loading workbook");

  const combined = project?.combined;
  const sheets = combined?.sheets ?? [];
  const sheet = sheets[activeSheet];

  useEffect(() => {
    setProcessing(true);
    setLoadingTitle("Loading workbook");
    LoadProject(supplierPath, emxPath)
      .then((loaded) => {
        setProject(loaded);
        setMapping(guessMapping(loaded.combined?.sheets[0]?.headers ?? []));
      })
      .catch((e) => {
        ToastError("Failed to load", String(e));
        onBack();
      })
      .finally(() => setProcessing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierPath, emxPath]);

  function handleSelectSheet(index: number) {
    setActiveSheet(index);
    setMapping(guessMapping(sheets[index]?.headers ?? []));
  }

  async function handleProcessing() {
    setLoadingTitle("Downloading images");
    setProcessing(true);
    try {
      await ProcessSheet(activeSheet, mapping as main.ColumnMapping);
      ToastSucess("Images downloaded");
    } catch (e) {
      ToastError("Processing failed", String(e));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="relative flex h-screen flex-col bg-background">
      {processing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{loadingTitle}…</p>
        </div>
      )}

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
          <Button size="sm" disabled={!sheet || processing} className="w-full" onClick={handleProcessing}>
            Process {sheet?.rows.length ?? 0} rows <ChevronRight className="size-3" />
          </Button>
        </nav>
        {sheet ? (
          <MappingGrid sheet={sheet} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
            {!processing && "No products matched the EMX catalogue. Check that the supplier and EMX files belong to the same supplier."}
          </div>
        )}
      </div>
    </div>
  );
}
