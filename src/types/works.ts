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
  institution: string;
  institution_id: number | null;
  district: string;
  taluk: string | null;
  constituency: string | null;
  category: string;
  academic_year: string | null;
  scheme: string | null;
  agency: string | null;
  status: WorkStatusKey;
  is_kkrdb: boolean;
  estimate_amount: number | null;
  contract_amount: number | null;
  revised_amount: number | null;
  financial_progress: number | null;
  physical_progress: number | null;
  work_order_date: string | null;
  site_handover_date: string | null;
  start_date: string | null;
  due_date: string | null;
  extension_date: string | null;
  completion_date: string | null;
  approval_reference: string | null;
  contractor: string | null;
  site_details: string | null;
  progress_details: string | null;
  remarks: string | null;
  source_file: string | null;
  source_sheet: string | null;
  source_row: number | null;
  source_json?: Record<string, unknown> | null;
  updated_at: string | null;
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
  date_from?: string;
  date_to?: string;
  progress_min?: number;
  progress_max?: number;
  kkrdb?: boolean;
}
