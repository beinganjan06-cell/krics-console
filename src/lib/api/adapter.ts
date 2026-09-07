import type { ListParams, Paginated } from "@/types/api";
import type { MasterPayload, MasterRecord, MasterResource } from "@/types/masters";
import type { Institution } from "@/types/institutions";
import type { Work } from "@/types/works";
import type {
  CategorySummaryRow,
  DashboardSummary,
  DistrictSummaryRow,
  FinancialProgressRow,
  InstitutionCoverageReport,
  PhysicalProgressReport,
  WorksSummaryReport,
} from "@/types/reports";
import type { ImportBatch, ImportResult, ImportedRow } from "@/types/imports";

export interface ApiAdapter {
  mode: "real" | "mock";
  listMasters(resource: MasterResource, params: ListParams): Promise<Paginated<MasterRecord>>;
  createMaster(resource: MasterResource, payload: MasterPayload): Promise<MasterRecord>;
  updateMaster(
    resource: MasterResource,
    id: number,
    payload: Partial<MasterPayload>,
  ): Promise<MasterRecord>;
  deleteMaster(resource: MasterResource, id: number): Promise<void>;

  listInstitutions(params: ListParams): Promise<Paginated<Institution>>;
  getInstitution(id: number): Promise<Institution>;

  listWorks(params: ListParams): Promise<Paginated<Work>>;
  getWork(id: number): Promise<Work>;

  getDashboardSummary(params: ListParams): Promise<DashboardSummary>;

  getWorksSummary(params: ListParams): Promise<WorksSummaryReport>;
  getDistrictSummary(params: ListParams): Promise<DistrictSummaryRow[]>;
  getCategorySummary(params: ListParams): Promise<CategorySummaryRow[]>;
  getFinancialProgress(params: ListParams): Promise<FinancialProgressRow[]>;
  getPhysicalProgress(params: ListParams): Promise<PhysicalProgressReport>;
  getInstitutionCoverage(params: ListParams): Promise<InstitutionCoverageReport>;

  uploadExcel(files: File[]): Promise<ImportResult>;
  listBatches(params: ListParams): Promise<Paginated<ImportBatch>>;
  getBatch(id: number): Promise<ImportBatch>;
  listAuditRows(params: ListParams): Promise<Paginated<ImportedRow>>;
}
