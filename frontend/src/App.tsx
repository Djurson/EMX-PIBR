import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SpreadsheetPicker, type SelectedSpreadsheet } from "@/components/SpreadsheetPicker";
import { MappingStudio } from "@/components/studio/MappingStudio";
import { OpenSpreadsheetFromPath, LoadProject } from "../wailsjs/go/main/App";
import { main } from "../wailsjs/go/models";
import { OnFileDrop, OnFileDropOff } from "../wailsjs/runtime/runtime";
import { ToastError } from "@/lib/ToastFunctions";
import { cn } from "./lib/utils";
import { ChevronRight } from "lucide-react";

export type FileVariant = "supplier" | "emx";

export default function App() {
  const [supplierFile, setSupplierFile] = useState<SelectedSpreadsheet | null>(null);
  const [emxFile, setEmxFile] = useState<SelectedSpreadsheet | null>(null);
  const [project, setProject] = useState<main.Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState<FileVariant | null>(null);

  useEffect(() => {
    OnFileDrop(async (x, y, paths) => {
      setDragging(null);
      const path = paths[0];
      if (!path) return;

      const el = document.elementFromPoint(x, y);
      const zone = el?.closest("[data-drop-zone]")?.getAttribute("data-drop-zone") as FileVariant | null;
      if (!zone) return;

      try {
        const info = await OpenSpreadsheetFromPath(path);
        if (!info) return;
        const file: SelectedSpreadsheet = {
          name: info.filename,
          path: info.path,
          size: info.size,
          totalRows: info.totalRows,
          isExcel: info.isExcel,
          numberOfSheets: info.numberOfSheets,
          totalExcelTables: info.totalExcelTables,
          headers: info.headers ?? [],
        };
        if (zone === "supplier") setSupplierFile(file);
        else setEmxFile(file);
      } catch (err) {
        ToastError("Could not open file", String(err));
      }
    }, true);

    return () => OnFileDropOff();
  }, []);

  const handleFileChange = (variant: FileVariant, file: SelectedSpreadsheet | null) => (variant === "supplier" ? setSupplierFile(file) : setEmxFile(file));

  async function openStudio() {
    if (!supplierFile || !emxFile) return;
    setLoading(true);
    try {
      const project = await LoadProject(supplierFile.path, emxFile.path);
      setProject(project);
    } catch (e) {
      ToastError(`Failed to load: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  if (project) return <MappingStudio project={project} onBack={() => setProject(null)} />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <img src="src/assets/images/appicon.png" className="size-16" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SPIX</h1>
            <p className="text-sm text-muted-foreground">Supplier Products Importer &amp; Exporter</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <div className="flex items-center gap-2.5">
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full  text-xs font-semibold", supplierFile ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}>1</span>
                <div>
                  <CardTitle className="text-sm">Supplier file</CardTitle>
                  <CardDescription className="text-xs">Bolt, Polisport, or other supplier export</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <SpreadsheetPicker variant="supplier" value={supplierFile} onChange={handleFileChange} dragging={dragging === "supplier"} />
            </CardContent>
          </Card>

          <Card className={cn("gap-0 overflow-hidden py-0", supplierFile ? "opacity-100" : "opacity-20")}>
            <CardHeader className="border-b py-4">
              <div className="flex items-center gap-2.5">
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", !supplierFile ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}>2</span>
                <div>
                  <CardTitle className="text-sm">EMX catalogue</CardTitle>
                  <CardDescription className="text-xs">Pyramid export with article numbers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <SpreadsheetPicker variant="emx" value={emxFile} onChange={handleFileChange} dragging={dragging === "emx"} disabled={!supplierFile} />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button size="lg" disabled={!supplierFile || !emxFile || loading} onClick={openStudio} className="flex items-center">
            {loading ? "Reading…" : "Open in studio"}
            {!loading && <ChevronRight className="size-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
