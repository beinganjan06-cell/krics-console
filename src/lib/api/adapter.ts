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
  ReportResponse,
  ReportSlug,
  WorksSummaryReport,
} from "@/types/reports";
import type { ImportBatch, ImportResult, ImportedRow } from "@/types/imports";
import type { AuthUser, LoginPayload, LoginResponse, PasswordResetPayload, PasswordResetResponse } from "@/types/auth";
import type { AdminMenu, AdminRole, AdminUser, MenuPayload, RoleAccessItem, RolePayload, UserPayload } from "@/types/access";

export interface ApiAdapter {
  mode: "real" | "mock";
  login(payload: LoginPayload): Promise<LoginResponse>;
  logout(): Promise<void>;
  getMe(): Promise<AuthUser>;
  requestPasswordReset(payload: PasswordResetPayload): Promise<PasswordResetResponse>;
  listMasters(resource: MasterResource, params: ListParams): Promise<Paginated<MasterRecord>>;
  getMaster(resource: MasterResource, id: number): Promise<MasterRecord>;
  createMaster(resource: MasterResource, payload: MasterPayload): Promise<MasterRecord>;
  updateMaster(
    resource: MasterResource,
    id: number,
    payload: Partial<MasterPayload>,
  ): Promise<MasterRecord>;
  deleteMaster(resource: MasterResource, id: number): Promise<void>;

  listInstitutions(params: ListParams): Promise<Paginated<Institution>>;
  getInstitution(id: number): Promise<Institution>;
  createInstitution(payload: Partial<Institution> & { name: string }): Promise<Institution>;
  updateInstitution(id: number, payload: Partial<Institution>): Promise<Institution>;
  deleteInstitution(id: number): Promise<void>;

  listWorks(params: ListParams): Promise<Paginated<Work>>;
  getWork(id: number): Promise<Work>;
  createWork(payload: Partial<Work> & { name: string }): Promise<Work>;
  updateWork(id: number, payload: Partial<Work>): Promise<Work>;
  deleteWork(id: number): Promise<void>;

  getDashboardSummary(params: ListParams): Promise<DashboardSummary>;
  getReport(slug: ReportSlug | string, params?: ListParams): Promise<ReportResponse>;
  exportReport(slug: ReportSlug | string, format: "excel" | "word", params?: ListParams): Promise<void>;

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

  listMenus(params?: ListParams): Promise<Paginated<AdminMenu>>;
  createMenu(payload: MenuPayload): Promise<AdminMenu>;
  updateMenu(id: number, payload: Partial<MenuPayload>): Promise<AdminMenu>;
  deleteMenu(id: number): Promise<void>;

  listRoles(params?: ListParams): Promise<Paginated<AdminRole>>;
  createRole(payload: RolePayload): Promise<AdminRole>;
  updateRole(id: number, payload: Partial<RolePayload>): Promise<AdminRole>;
  deleteRole(id: number): Promise<void>;
  updateRoleAccess(id: number, access: RoleAccessItem[]): Promise<AdminRole>;

  listUsers(params?: ListParams): Promise<Paginated<AdminUser>>;
  createUser(payload: UserPayload): Promise<AdminUser>;
  updateUser(id: number, payload: Partial<UserPayload>): Promise<AdminUser>;
  deleteUser(id: number): Promise<void>;
}
