export type WorkStatusKey =
  | "ongoing"
  | "completed"
  | "tender_stage"
  | "estimate_stage"
  | "site_problem"
  | "not_started"
  | "handed_over";

export const WORK_STATUS_LABEL: Record<WorkStatusKey, string> = {
  ongoing: "Ongoing",
  completed: "Completed",
  tender_stage: "Tender stage",
  estimate_stage: "Estimate stage",
  site_problem: "Site problem",
  not_started: "Not started",
  handed_over: "Handed over",
};

export const WORK_STATUS_KEYS = Object.keys(WORK_STATUS_LABEL) as WorkStatusKey[];

export interface Work {
  id: number;
  code: string;
  name: string;
  work_type: string;
  // FK ids
  institution: number | null;
  category: number | null;
  district: number | null;
  taluk: number | null;
  constituency: number | null;
  academic_year: number | null;
  scheme: number | null;
  agency: number | null;
  status: number | null;
  is_active: boolean;
  // Annotated name fields from serializer
  institution_name: string | null;
  district_name: string | null;
  taluk_name: string | null;
  constituency_name: string | null;
  category_name: string | null;
  academic_year_name: string | null;
  scheme_name: string | null;
  agency_name: string | null;
  status_name: string | null;
  approval_reference: string;
  contractor_name: string;
  estimate_amount_lakh: number | null;
  contract_amount_lakh: number | null;
  revised_amount_lakh: number | null;
  financial_progress_lakh: number | null;
  physical_progress_percent: number | null;
  work_order_date: string | null;
  site_handover_date: string | null;
  start_date: string | null;
  due_date: string | null;
  extension_date: string | null;
  completion_date: string | null;
  site_details: string;
  progress_details: string;
  remarks: string;
  source_file: string;
  source_sheet: string;
  source_row: number | null;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkFilters {
  search?: string;
  district?: string;
  taluk?: string;
  category?: string;
  academic_year?: string;
  scheme?: string;
  agency?: string;
  status?: string;
  kkrdb?: boolean;
}
