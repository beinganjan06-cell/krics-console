import type { WorkStatusKey } from "./works";

export type DashboardTotalKey =
  | "institutions"
  | "residential_schools"
  | "hostels"
  | "pu_colleges"
  | "works"
  | "ongoing_works"
  | "completed_works"
  | "site_problem_records";

export interface DashboardKpiMetric {
  key: DashboardTotalKey;
  label: string;
  value: number;
}

export interface DashboardSiteCard {
  status: "available" | "not_available" | "problem";
  label: string;
  count: number;
}

export interface DashboardSummary {
  kpi_metrics?: DashboardKpiMetric[];
  totals: Record<DashboardTotalKey, number>;
  previous_period: Partial<Record<DashboardTotalKey, number>>;
  work_status_distribution: { status: WorkStatusKey; label?: string; count: number }[];
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
  site_cards?: DashboardSiteCard[];
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

export type ReportSlug =
  | "works-summary"
  | "district-summary"
  | "category-summary"
  | "financial-progress"
  | "physical-progress"
  | "institution-coverage";

export interface ReportColumn {
  key: string;
  label: string;
  label_kn: string;
  type: "text" | "number" | "percent" | "date";
  export?: boolean;
}

export interface ReportGroupOption {
  value: string;
  label: string;
  label_kn: string;
}

export interface ReportResponse {
  slug: ReportSlug | string;
  title: string;
  title_kn: string;
  subtitle: string;
  subtitle_kn?: string;
  generated_at: string;
  group_by: string;
  group_by_options: ReportGroupOption[];
  filters_applied: { label: string; value: string }[];
  available_fields: ReportColumn[];
  columns: ReportColumn[];
  rows: Record<string, string | number | null>[];
  totals: Record<string, string | number | null>;
  row_count: number;
  by_status?: { status: WorkStatusKey; label?: string; count: number }[];
  buckets?: { bucket: string; count: number }[];
  by_type?: { type: string; count: number }[];
  site?: { available: number; not_available: number; problem: number };
}

export const REPORT_SLUGS: ReportSlug[] = [
  "works-summary",
  "district-summary",
  "category-summary",
  "financial-progress",
  "physical-progress",
  "institution-coverage",
];

