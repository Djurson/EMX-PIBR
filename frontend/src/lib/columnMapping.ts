/**
 * Stable identifiers for the EMX output fields a source column can map to.
 */
export type FieldKey = "articleNumber" | "description" | "images" | "manuals";

/** Definition of a single mappable EMX output field. */
export interface FieldDef {
  /** Stable identifier used as the mapping record key. */
  key: FieldKey;
  /** Human-readable label shown in the config drawer. */
  label: string;
  /** Whether a source column must be assigned before continuing. */
  required: boolean;
  /** When true, multiple source columns can be assigned to this field. */
  multi: boolean;
  /** Lowercase substrings used to auto-guess a matching source column. */
  keywords: string[];
}

/**
 * Maps each EMX output field to a chosen source column header (or headers for
 * multi fields), or `null` when unassigned. Keys are exhaustive over {@link FieldKey}.
 */
export type ColumnMapping = {
  articleNumber: string | null;
  description: string | null;
  images: string[];
  manuals: string | null;
};

/** The EMX output fields, in display order. */
export const EMX_FIELDS: FieldDef[] = [
  { key: "articleNumber", label: "Article Number", required: true, multi: false, keywords: ["manufacturer", "mfr", "supplier", "item number", "item no", "art", "sku", "part"] },
  { key: "description", label: "Product Description", required: false, multi: false, keywords: ["description", "desc", "name", "title", "product"] },
  { key: "images", label: "Product Images", required: false, multi: true, keywords: ["image", "img", "photo", "picture", "url", "link"] },
  { key: "manuals", label: "Product Manuals", required: false, multi: false, keywords: ["manual", "instruction", "guide"] },
];

function normalize(header: string): string {
  return header.trim().toLowerCase();
}

/**
 * Auto-guesses a column mapping by matching each field's keywords against the
 * provided headers. Each header is assigned to at most one field; fields are
 * resolved in {@link EMX_FIELDS} order so earlier fields win on a tie.
 * @param headers - Source column headers from the spreadsheet.
 * @returns A mapping with a best-guess header per field, or null/[] if no match.
 */
export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { articleNumber: null, description: null, images: [], manuals: null };
  const taken = new Set<string>();

  for (const field of EMX_FIELDS) {
    for (const header of headers) {
      if (taken.has(header)) continue;
      const norm = normalize(header);
      if (field.keywords.some((kw) => norm.includes(kw))) {
        taken.add(header);
        if (field.key === "images") {
          mapping.images.push(header);
        } else {
          mapping[field.key] = header;
          break;
        }
      }
    }
  }

  return mapping;
}

/**
 * Reports whether every required field in the mapping has an assigned column.
 * @param mapping - The current column mapping.
 * @returns `true` when all `required` fields are non-null / non-empty.
 */
export function isMappingComplete(mapping: ColumnMapping): boolean {
  return EMX_FIELDS.filter((f) => f.required).every((f) => {
    const val = mapping[f.key];
    return Array.isArray(val) ? val.length > 0 : val !== null;
  });
}
