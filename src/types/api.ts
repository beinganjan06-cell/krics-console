export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiErrorShape {
  detail: string;
  field_errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;

  constructor(message: string, status = 0, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface ListParams extends QueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  // master filters
  is_active?: boolean | string;
  division?: string | number;
  district?: string | number;
  taluk?: string | number;
  // institution filters
  institution_type?: string;
  category?: string;
  site_status?: string;
  academic_year?: string;
  // work filters
  status?: string;
  scheme?: string;
  agency?: string;
  kkrdb?: boolean | string;
  progress_min?: number | string;
  progress_max?: number | string;
  date_from?: string;
  date_to?: string;
  // report filters
  group_by?: string;
  fields?: string;
  format?: string;
  // import filters
  entity_type?: string;
  row_number?: number | string;
}
