export type SiteStatus = "available" | "not_available" | "problem" | "unknown";

export interface Institution {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  institution_type: number | null;
  category: number | null;
  division: number | null;
  district: number | null;
  taluk: number | null;
  constituency: number | null;
  hobli: number | null;
  academic_year: number | null;
  institution_type_name: string | null;
  category_name: string | null;
  division_name: string | null;
  district_name: string | null;
  taluk_name: string | null;
  constituency_name: string | null;
  hobli_name: string | null;
  academic_year_name: string | null;
  site_status: SiteStatus;
  site_details: string;
  student_capacity: number | null;
  source_file: string;
  source_sheet: string;
  source_row: number | null;
  raw_data?: Record<string, unknown>;
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
  unknown: "Unknown",
};
