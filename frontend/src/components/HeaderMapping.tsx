import { ColumnMapping, EMX_FIELDS, type FieldKey } from "@/lib/columnMapping";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface HeaderMappingProps {
  /** Source column headers from the parsed spreadsheet. */
  headers: string[];
  /** Current field → column assignment. */
  mapping: ColumnMapping;
  /** Called with the updated mapping when a selection changes. */
  onChange: (mapping: ColumnMapping) => void;
}

/**
 * Column-mapping step: pairs each EMX output field with a source column
 * selected from the spreadsheet's headers. Required fields are marked with an
 * asterisk. Selecting the empty option clears a field's assignment.
 */
export function HeaderMapping({ headers, mapping, onChange }: HeaderMappingProps) {
  function setField(key: FieldKey, value: string) {
    onChange({ ...mapping, [key]: value === "" ? null : value });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1.4fr] items-center gap-3">
        <Label htmlFor="emx-prefix">
          Prefix for manufacturer <span className="ml-1 text-destructive">*</span>
        </Label>
        <Input type="text" maxLength={6} placeholder="Prefix" id="emx-prefix" />
      </div>
      {EMX_FIELDS.map((field) => (
        <div key={field.key} className="grid grid-cols-[1fr_1.4fr] items-center gap-3">
          <Label htmlFor={`map-${field.key}`} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <Select>
            <SelectTrigger className="h-9 w-full text-sm rounded-md bg-transparent">
              <SelectValue placeholder={mapping[field.key] ?? "Choose header"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {headers.map((header, i) => (
                  <SelectItem key={`${header}-${i}`} value={header}>
                    {header || `(column ${i + 1})`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
