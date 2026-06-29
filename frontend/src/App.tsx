import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SpreadsheetPicker, type SelectedSpreadsheet } from "@/components/SpreadsheetPicker";
import { HeaderMapping } from "@/components/HeaderMapping";
import { guessMapping, isMappingComplete, type ColumnMapping } from "@/lib/columnMapping";

/** Ordered wizard steps. Append future steps here — the chrome adapts automatically. */
const STEPS = [
  { id: "import", title: "Import spreadsheet", description: "Upload an Excel or CSV file to extract part numbers, descriptions and images." },
  { id: "headers", title: "Choose headers", description: "Match your spreadsheet columns to the EMX output fields." },
] as const;

export default function App() {
  const [step, setStep] = useState(0);
  /** Slide direction of the most recent transition; drives the enter animation. */
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const [file, setFile] = useState<SelectedSpreadsheet | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>(() => guessMapping([]));

  const isLast = step === STEPS.length - 1;

  /** Whether the current step is satisfied and the user may advance. */
  function canContinue(): boolean {
    switch (step) {
      case 0:
        return !!file;
      case 1:
        return isMappingComplete(mapping);
      default:
        return true;
    }
  }

  function goNext() {
    if (step === 0 && file) {
      setMapping(guessMapping(file.headers));
    }
    if (isLast) return; // final step action wired up later
    setDirection("forward");
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection("back");
    setStep((s) => Math.max(0, s - 1));
  }

  const current = STEPS[step];
  const enterAnim = direction === "forward" ? "slide-in-from-right-8" : "slide-in-from-left-8";

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

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-5">
            <CardTitle className="text-base">{current.title}</CardTitle>
            <CardDescription>{current.description}</CardDescription>
          </CardHeader>

          <CardContent className="py-6">
            {/* Re-mount per step so the enter animation replays on each transition. */}
            <div key={current.id} className={`animate-in fade-in ${enterAnim} duration-300`}>
              {step === 0 && <SpreadsheetPicker value={file} onChange={setFile} />}
              {step === 1 && <HeaderMapping headers={file?.headers ?? []} mapping={mapping} onChange={setMapping} />}
            </div>
          </CardContent>

          <CardFooter className="justify-between border-t py-4">
            <p className="text-xs text-muted-foreground">
              {current.title} — Step {step + 1} of {STEPS.length}
            </p>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={goBack}>
                  Back
                </Button>
              )}
              <Button disabled={!canContinue()} onClick={goNext}>
                {isLast ? "Finish" : "Continue"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
