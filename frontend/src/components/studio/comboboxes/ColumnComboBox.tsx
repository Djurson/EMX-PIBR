import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

interface ColumnComboboxProps {
  /** Currently selected column index, or null. */
  value: number | null;
  /** All available headers. */
  headers: string[];
  /** Called with the new column index or null when cleared. */
  onChange: (value: number | null) => void;
  placeholder?: string;
}

/** Single-select searchable combobox for choosing one source column. */
export function ColumnCombobox({ value, headers, onChange, placeholder = "None" }: ColumnComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = value === null ? placeholder : headers[value] || `(column ${value + 1})`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="h-8 w-full justify-between text-xs font-normal truncate">
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-1 size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-md" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList className="max-h-48">
            <CommandEmpty>No column found.</CommandEmpty>
            <CommandItem
              value="__none__"
              onSelect={() => {
                onChange(null);
                setOpen(false);
              }}>
              <span className="text-muted-foreground">None</span>
            </CommandItem>
            {headers.map((header, i) => {
              const label = header || `(column ${i + 1})`;
              return (
                <CommandItem
                  key={i}
                  value={`${i}:${label}`}
                  onSelect={() => {
                    onChange(i);
                    setOpen(false);
                  }}>
                  <Check className={cn("mr-1 size-3", value === i ? "opacity-100" : "opacity-0")} />
                  {label}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
