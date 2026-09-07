export type ImportEntityType = "institution" | "work" | "raw";

export interface ImportBatch {
  id: number;
  batch_ref: string;
  started_at: string;
  completed_at: string | null;
  source: string;
  file_count: number;
  row_count: number;
  rows_imported: number;
  institutions_upserted: number;
  works_upserted: number;
  masters_created: number;
  raw_rows_archived: number;
  error_count: number;
  warning_count: number;
  status: "queued" | "running" | "completed" | "failed" | "completed_with_warnings";
  file_errors: { file: string; sheet: string | null; row: number | null; message: string }[];
}

export interface ImportedRow {
  id: number;
  batch_ref: string;
  source_file: string;
  sheet: string;
  row_number: number;
  entity_type: ImportEntityType;
  raw_json: Record<string, unknown>;
  normalized_json: Record<string, unknown>;
  created_at: string;
}

export interface ImportPreview {
  file_name: string;
  size_bytes: number;
  sheets: string[];
  header_row: number;
  estimated_rows: number;
  entity_type: ImportEntityType;
  sample_rows: Record<string, string>[];
  warnings: string[];
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
