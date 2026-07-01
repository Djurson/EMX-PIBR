/**
 * Stable identifiers for the EMX output fields a source column can map to.
 */
export type FieldKey = "emxNumber" | "articleNumber" | "description" | "images" | "manuals";

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
 * Maps each EMX output field to a chosen source column index (or indices for
 * multi fields), or `null` when unassigned. Indices are 0-based positions into
 * the sheet's header row, so the Go backend can address columns directly and
 * duplicate header names stay distinct. Keys are exhaustive over {@link FieldKey}.
 */
export type ColumnMapping = {
  [K in FieldKey]: K extends "images" ? number[] : number | null;
};

/** The EMX output fields, in display order. */
export const EMX_FIELDS: FieldDef[] = [
  { key: "emxNumber", label: "EMX - Article Number", required: true, multi: false, keywords: ["emx", "article", "number"] },
  { key: "articleNumber", label: "Supplier Article Number", required: true, multi: false, keywords: ["manufacturer", "mfr", "supplier", "item number", "item no", "art", "sku", "part"] },
  { key: "description", label: "Product Description", required: false, multi: false, keywords: ["description", "desc", "name", "title", "product"] },
  { key: "images", label: "Product Images", required: false, multi: true, keywords: ["image", "img", "photo", "picture", "url", "link"] },
  { key: "manuals", label: "Product Manuals", required: false, multi: false, keywords: ["manual", "instruction", "guide"] },
];

const normalize = (header: string): string => header.trim().toLowerCase();

/**
 * Auto-guesses a column mapping by matching each field's keywords against the
 * provided headers. Each header is assigned to at most one field; fields are
 * resolved in {@link EMX_FIELDS} order so earlier fields win on a tie.
 * @param headers - Source column headers from the spreadsheet.
 * @returns A mapping with a best-guess header per field, or null/[] if no match.
 */
export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { emxNumber: null, articleNumber: null, description: null, images: [], manuals: null };
  const taken = new Set<number>();

  for (const field of EMX_FIELDS) {
    for (let i = 0; i < headers.length; i++) {
      if (taken.has(i)) continue;
      const norm = normalize(headers[i]);
      if (field.keywords.some((kw) => norm.includes(kw))) {
        taken.add(i);
        if (field.key === "images") {
          mapping.images.push(i);
        } else {
          mapping[field.key] = i;
          break;
        }
      }
    }
  }

  return mapping;
}
