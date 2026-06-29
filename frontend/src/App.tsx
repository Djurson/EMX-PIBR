import { useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from "@/components/ui/attachment";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Kbd, KbdGroup } from "./components/ui/kbd";

function App() {
  const [file, setFile] = useState<{ name: string; meta: string } | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-lg space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <img src="src/assets/images/appicon.png" className="size-24" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">PIBR</h1>
            <p className="text-sm text-muted-foreground">Product Image Batcher &amp; Renamer</p>
          </div>
        </div>

        <Card className="gap-0 py-0">
          <CardHeader className="border-b py-5">
            <CardTitle className="text-base">Import spreadsheet</CardTitle>
            <CardDescription>Upload an Excel or CSV file to extract part numbers and product descriptions, images, etc.</CardDescription>
          </CardHeader>

          <CardContent className="py-6">
            {file ? (
              <Attachment state="done">
                <AttachmentMedia>
                  <FileSpreadsheet className="size-5" />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{file.name}</AttachmentTitle>
                  <AttachmentDescription>{file.meta}</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction aria-label="Remove file" onClick={() => setFile(null)}>
                    <X className="size-3.5" />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setFile({ name: "products_2024_q4.xlsx", meta: "XLSX · 1.4 MB · 842 rows" })}
                onKeyDown={(e) => e.key === "Enter" && setFile({ name: "products_2024_q4.xlsx", meta: "XLSX · 1.4 MB · 842 rows" })}
                className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors hover:border-ring hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Drop your file here, or <span className="text-primary underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports{" "}
                    <KbdGroup>
                      <Kbd>.csv</Kbd> and <Kbd>.xlsx</Kbd>
                    </KbdGroup>
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-between border-t py-4">
            <p className="text-xs text-muted-foreground">Step 1 of 4 — Import</p>
            <Button disabled={!file}>Continue</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default App;
