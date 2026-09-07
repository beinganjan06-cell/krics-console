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
}
