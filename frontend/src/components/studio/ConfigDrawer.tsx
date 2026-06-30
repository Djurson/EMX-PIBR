import { Label } from "@/components/ui/label";
import { EMX_FIELDS, type ColumnMapping, type FieldKey } from "@/lib/columnMapping";
import { ColumnMultiCombobox } from "@/components/studio/comboboxes/ColumnMultiCombobox";
import { ColumnCombobox } from "@/components/studio/comboboxes/ColumnComboBox";

interface ConfigDrawerProps {
  /** Current field → column assignment. */
  mapping: ColumnMapping;
  /** Called with the updated mapping when a field's column changes. */
  onMappingChange: (mapping: ColumnMapping) => void;
  /** Source column headers from the active sheet. */
  headers: string[];
}

/**
 * Right drawer holding the supplier profile (prefix + separator with a live
 * resolved example) and the column-to-field mapping for each output type.
 */
export function ConfigDrawer({ mapping, onMappingChange, headers }: ConfigDrawerProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto px-2 flex-1">
      <section className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Column mapping</p>
        {EMX_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs">
              {field.label}
              {field.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            {field.multi ? (
              <ColumnMultiCombobox value={mapping.images} headers={headers} onChange={(v) => onMappingChange({ ...mapping, images: v })} />
            ) : (
              <ColumnCombobox value={mapping[field.key as Exclude<FieldKey, "images">]} headers={headers} onChange={(v) => onMappingChange({ ...mapping, [field.key]: v })} />
            )}
          </div>
        ))}
      </section>
    </aside>
  );
}
