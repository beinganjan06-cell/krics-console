export type ImportEntityType = "institution" | "work" | "raw";

export interface ImportBatch {
  id: number;
  started_at: string;
  completed_at: string | null;
  source_directory: string;
  files_seen: number;
  rows_seen: number;
  rows_imported: number;
  errors: { file?: string; sheet?: string; row?: number; message: string }[];
  // mock-compat extras (absent in real API, optional)
  batch_ref?: string;
  source?: string;
  file_count?: number;
  row_count?: number;
  error_count?: number;
  warning_count?: number;
  status?: string;
  file_errors?: { file: string; sheet: string | null; row: number | null; message: string }[];
}

export interface ImportedRow {
  id: number;
  batch: number;
  source_file: string;
  source_sheet: string;
  source_row: number;
  row_data: Record<string, unknown>;
  entity_type: string;
  imported_at: string;
  // mock-compat extras
  batch_ref?: string;
  sheet?: string;
  row_number?: number;
  raw_json?: Record<string, unknown>;
  normalized_json?: Record<string, unknown>;
  created_at?: string;
}

export interface ImportResult {
  batch_ref: string;
  batch_id: number;
  files_processed: number;
  rows_seen: number;
  rows_imported: number;
  institutions_upserted: number;
  works_upserted: number;
  masters_created: number;
  raw_rows_archived: number;
  errors: { file: string; sheet: string | null; row: number | null; message: string }[];
  warnings: string[];
}
