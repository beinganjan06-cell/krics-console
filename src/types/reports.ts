import type { WorkStatusKey } from "./works";

export interface DashboardSummary {
  totals: {
    institutions: number;
    residential_schools: number;
    hostels: number;
    pu_colleges: number;
    works: number;
    ongoing_works: number;
    completed_works: number;
    site_problem_records: number;
  };
  previous_period: Partial<Record<keyof DashboardSummary["totals"], number>>;
  work_status_distribution: { status: WorkStatusKey; count: number }[];
  district_works: { district: string; works: number }[];
  progress_by_district: { district: string; financial_lakh: number; physical_pct: number }[];
  recent_works: {
    id: number;
    name: string;
    district: string;
    status: WorkStatusKey;
    physical_progress: number | null;
    updated_at: string | null;
  }[];
  site_snapshot: { available: number; not_available: number; problem: number };
}

export interface WorksSummaryReport {
  by_status: { status: WorkStatusKey; count: number }[];
  total_estimate_lakh: number;
  total_contract_lakh: number;
  total_financial_progress_lakh: number;
  average_physical_progress: number;
}

export interface DistrictSummaryRow {
  district: string;
  institutions: number;
  works: number;
  ongoing: number;
  completed: number;
  site_problems: number;
  estimate_lakh: number;
  financial_progress_lakh: number;
  average_physical_progress: number;
}

export interface CategorySummaryRow {
  category: string;
  institutions: number;
  works: number;
  estimate_lakh: number;
  financial_progress_lakh: number;
  average_physical_progress: number;
}

export interface FinancialProgressRow {
  group: string;
  estimate_lakh: number;
  contract_lakh: number;
  revised_lakh: number;
  financial_progress_lakh: number;
}

export interface PhysicalProgressReport {
  buckets: { bucket: string; count: number }[];
  rows: { group: string; works: number; average_physical_progress: number }[];
}

export interface InstitutionCoverageReport {
  by_type: { type: string; count: number }[];
  site: { available: number; not_available: number; problem: number };
  districts: { district: string; institutions: number; taluks: number; hoblis: number }[];
}
