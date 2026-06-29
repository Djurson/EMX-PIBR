import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SpreadsheetPicker, type SelectedSpreadsheet } from "@/components/SpreadsheetPicker";

export default function App() {
  const [file, setFile] = useState<SelectedSpreadsheet | null>(null);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-lg space-y-2">
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
            <SpreadsheetPicker value={file} onChange={setFile} />
          </CardContent>

          <CardFooter className="justify-between border-t py-4">
            <p className="text-xs text-muted-foreground">Import - Step 1 of 4</p>
            <Button disabled={!file}>Continue</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
