export type SiteStatus = "available" | "not_available" | "problem";

export interface Institution {
  id: number;
  code: string;
  name: string;
  institution_type: string;
  category: string;
  division: string | null;
  district: string;
  taluk: string | null;
  constituency: string | null;
  hobli: string | null;
  academic_year: string | null;
  site_status: SiteStatus;
  site_details: string | null;
  survey_details: string | null;
  student_capacity: number | null;
  source_file: string | null;
  source_sheet: string | null;
  source_row: number | null;
  source_json?: Record<string, unknown> | null;
  updated_at: string | null;
}

export interface InstitutionFilters {
  search?: string;
  institution_type?: string;
  category?: string;
  district?: string;
  taluk?: string;
  site_status?: SiteStatus | string;
  academic_year?: string;
}

export const SITE_STATUS_LABEL: Record<SiteStatus, string> = {
  available: "Site available",
  not_available: "Site not available",
  problem: "Site problem",
};
