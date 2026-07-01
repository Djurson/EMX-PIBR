import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { ColumnMultiComboboxProps } from "./types";

/** Multi-select searchable combobox for choosing multiple source columns. */
export function ColumnMultiCombobox({ value, headers, onChange, placeholder = "None" }: ColumnMultiComboboxProps) {
  const [open, setOpen] = useState(false);

  const toggle = (i: number) => onChange(value.includes(i) ? value.filter((v) => v !== i) : [...value, i]);

  const triggerLabel = value.length === 0 ? placeholder : value.length === 1 ? headers[value[0]] || `(column ${value[0] + 1})` : `${value.length} columns`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="h-8 w-full justify-between text-xs font-normal">
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-1 size-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl" align="start" sideOffset={4}>
        <Command>
          <CommandInput placeholder="Search columns..." />
          <CommandList className="max-h-48">
            <CommandEmpty>No column found.</CommandEmpty>
            {headers.map((header, i) => {
              const label = header || `(column ${i + 1})`;
              const selected = value.includes(i);
              return (
                <CommandItem key={i} value={`${i}:${label}`} onSelect={() => toggle(i)}>
                  <Check className={cn("mr-1 size-3", selected ? "opacity-100" : "opacity-0")} />
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
