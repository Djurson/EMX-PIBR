export interface ColumnComboboxProps {
  /** Currently selected column index, or null. */
  value: number | null;
  /** All available headers. */
  headers: string[];
  /** Called with the new column index or null when cleared. */
  onChange: (value: number | null) => void;
  placeholder?: string;
}

export interface ColumnMultiComboboxProps {
  /** Currently selected column indices. */
  value: number[];
  /** All available headers. */
  headers: string[];
  /** Called with the updated selection when a column is toggled. */
  onChange: (value: number[]) => void;
  placeholder?: string;
}
