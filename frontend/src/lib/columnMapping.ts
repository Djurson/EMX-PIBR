/**
 * Stable identifiers for the EMX output fields a source column can map to.
 * Mirrors the export schema described in the project README.
 */
export type FieldKey = "emxItemNumber" | "manufacturerItemNumber" | "description" | "image" | "bike";

/** Definition of a single mappable EMX output field. */
export interface FieldDef {
  /** Stable identifier used as the mapping record key. */
  key: FieldKey;
  /** Human-readable label shown in the UI. */
  label: string;
  /** Whether a source column must be assigned before continuing. */
  required: boolean;
  /** Lowercase substrings used to auto-guess a matching source column. */
  keywords: string[];
}

/**
 * Maps each EMX output field to a chosen source column header, or `null` when
 * unassigned. Keys are exhaustive over {@link FieldKey}.
 */
export type ColumnMapping = Record<FieldKey, string | null>;

/**
 * The EMX output fields, in display order. `bike` is optional per the README
 * (fitment lookup is a best-effort feature).
 */
export const EMX_FIELDS: FieldDef[] = [
  { key: "manufacturerItemNumber", label: "Manufacturer item number", required: true, keywords: ["manufacturer", "mfr", "supplier", "item number", "item no", "art", "sku", "part"] },
  { key: "description", label: "Product description", required: true, keywords: ["description", "desc", "name", "title", "product"] },
  { key: "image", label: "Image", required: true, keywords: ["image", "img", "photo", "picture", "url", "link"] },
];

/** Normalizes a header for keyword matching: lowercase, trimmed. */
function normalize(header: string): string {
  return header.trim().toLowerCase();
}

/**
 * Auto-guesses a column mapping by matching each field's keywords against the
 * provided headers. Each header is assigned to at most one field; fields are
 * resolved in {@link EMX_FIELDS} order so earlier fields win on a tie.
 * @param headers - Source column headers from the spreadsheet.
 * @returns A mapping with a best-guess header per field, or `null` if no match.
 */
export function guessMapping(headers: string[]): ColumnMapping {
  const mapping = {} as ColumnMapping;
  const taken = new Set<string>();

  for (const field of EMX_FIELDS) {
    let match: string | null = null;
    for (const header of headers) {
      if (taken.has(header)) continue;
      const norm = normalize(header);
      if (field.keywords.some((kw) => norm.includes(kw))) {
        match = header;
        break;
      }
    }
    if (match) taken.add(match);
    mapping[field.key] = match;
  }

  return mapping;
}

/**
 * Reports whether every required field in the mapping has an assigned column.
 * @param mapping - The current column mapping.
 * @returns `true` when all `required` fields are non-null.
 */
export function isMappingComplete(mapping: ColumnMapping): boolean {
  return EMX_FIELDS.filter((f) => f.required).every((f) => mapping[f.key] !== null);
}
