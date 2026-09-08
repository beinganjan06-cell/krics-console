/**
 * DEVELOPMENT-ONLY mock API adapter.
 * Active only when VITE_API_BASE_URL is unset. It mirrors the Django REST
 * contract exactly (pagination envelope, field names, error shape) so that
 * switching to the real API requires no UI changes.
 */
import type { ListParams, Paginated } from "@/types/api";
import { ApiError } from "@/types/api";
import type { MasterPayload, MasterRecord, MasterResource } from "@/types/masters";
import type { Institution } from "@/types/institutions";
import type { Work, WorkStatusKey } from "@/types/works";
import { WORK_STATUS_KEYS } from "@/types/works";
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
import type { ApiAdapter } from "@/lib/api/adapter";
import * as db from "./data";
import type { LoginResponse } from "@/types/auth";
import * as accessStore from "./access-store";

const delay = (ms = 320) => new Promise((resolve) => setTimeout(resolve, ms));

function paginate<T>(rows: T[], params: ListParams): Paginated<T> {
  const page = Number(params.page ?? 1);
  const size = Number(params.page_size ?? 25);
  const start = (page - 1) * size;
  return {
    count: rows.length,
    next: start + size < rows.length ? `?page=${page + 1}` : null,
    previous: page > 1 ? `?page=${page - 1}` : null,
    results: rows.slice(start, start + size),
  };
}

function sortRows<T extends Record<string, unknown>>(rows: T[], ordering?: string): T[] {
  if (!ordering) return rows;
  const desc = ordering.startsWith("-");
  const key = desc ? ordering.slice(1) : ordering;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    const result = av > bv ? 1 : -1;
    return desc ? -result : result;
  });
}

function matches(value: unknown, needle: string): boolean {
  return String(value ?? "")
    .toLowerCase()
    .includes(needle.toLowerCase());
}

const masterStore = db.masters;

function mockMasterKey(resource: MasterResource): Exclude<MasterResource, "caste-categories"> {
  if (resource === "caste-categories") return "categories";
  return resource as Exclude<MasterResource, "caste-categories">;
}

export const mockAdapter: ApiAdapter = {
  mode: "mock",

  async login(payload) {
    await delay(280);
    const username = payload.username.trim();
    const name = username.includes("@")
      ? username.split("@")[0]!.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : username;
    const email = username.includes("@")
      ? username
      : username
        ? `${username.toLowerCase().replace(/\s+/g, ".")}@krics.karnataka.gov.in`
        : "admin@krics.karnataka.gov.in";
    return {
      access: `mock-access-${Date.now()}`,
      refresh: `mock-refresh-${Date.now()}`,
      user: {
        id: 1,
        name: name || "KRICS User",
        email,
        role: "Super Admin",
        role_code: "SUPER_ADMIN",
        menus: accessStore.mockMenusForUser(),
      },
    } satisfies LoginResponse;
  },

  async logout() {
    await delay(180);
  },

  async getMe() {
    await delay(120);
    return {
      id: 1,
      name: "KRICS User",
      email: "admin@krics.karnataka.gov.in",
      role: "Super Admin",
      role_code: "SUPER_ADMIN",
      menus: accessStore.mockMenusForUser(),
    };
  },

  async requestPasswordReset(payload) {
    await delay(520);
    const email = payload.email.trim();
    if (!email) {
      throw new ApiError("Please enter your registered email address.", 400, {
        email: ["Email address is required."],
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError("Enter a valid email address.", 400, {
        email: ["Enter a valid email address."],
      });
    }
    return { accepted: true };
  },

  async listMasters(resource, params) {
    await delay(220);
    let rows = [...(masterStore[mockMasterKey(resource)] ?? [])];
    if (params.search) {
      const q = String(params.search);
      rows = rows.filter((r) => matches(r.name, q) || matches(r.code, q));
    }
    if (params.is_active !== undefined && params.is_active !== "") {
      const active = String(params.is_active) === "true";
      rows = rows.filter((r) => r.is_active === active);
    }
    if (params.district) rows = rows.filter((r) => String(r.district) === String(params.district));
    if (params.division) rows = rows.filter((r) => String(r.division) === String(params.division));
    return paginate(sortRows(rows as unknown as Record<string, unknown>[], params.ordering) as unknown as MasterRecord[], params);
  },

  async createMaster(resource, payload) {
    await delay(400);
    const rows = masterStore[mockMasterKey(resource)];
    if (rows.some((r) => r.name.toLowerCase() === payload.name.toLowerCase() && r.is_active)) {
      throw new ApiError("Validation failed.", 400, {
        name: ["A record with this name already exists."],
      });
    }
    const inactive = rows.find((r) => r.name.toLowerCase() === payload.name.toLowerCase() && !r.is_active);
    if (inactive) {
      const restored: MasterRecord = {
        ...inactive,
        ...payload,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      const index = rows.findIndex((r) => r.id === inactive.id);
      rows[index] = restored;
      return restored;
    }
    const parentDivision = payload.division
      ? masterStore.divisions.find((d) => d.id === payload.division)
      : undefined;
    const parentDistrict = payload.district
      ? masterStore.districts.find((d) => d.id === payload.district)
      : undefined;
    const parentTaluk = payload.taluk
      ? masterStore.taluks.find((t) => t.id === payload.taluk)
      : undefined;
    const record: MasterRecord = {
      id: Math.max(0, ...rows.map((r) => r.id)) + 1,
      name: payload.name,
      code: payload.code ?? null,
      is_active: payload.is_active,
      division: payload.division ?? null,
      division_name: parentDivision?.name ?? null,
      district: payload.district ?? parentTaluk?.district ?? null,
      district_name: parentDistrict?.name ?? parentTaluk?.district_name ?? null,
      taluk: payload.taluk ?? null,
      taluk_name: parentTaluk?.name ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reference_count: 0,
    };
    rows.unshift(record);
    return record;
  },

  async getMaster(resource, id) {
    await delay(180);
    const record = masterStore[mockMasterKey(resource)]?.find((r) => r.id === id);
    if (!record) throw new ApiError("Record not found.", 404);
    return record;
  },

  async updateMaster(resource, id, payload) {
    await delay(380);
    const rows = masterStore[mockMasterKey(resource)];
    const index = rows.findIndex((r) => r.id === id);
    if (index < 0) throw new ApiError("Record not found.", 404);
    const parentDivision = payload.division
      ? masterStore.divisions.find((d) => d.id === payload.division)
      : undefined;
    const parentDistrict = payload.district
      ? masterStore.districts.find((d) => d.id === payload.district)
      : undefined;
    const parentTaluk = payload.taluk
      ? masterStore.taluks.find((t) => t.id === payload.taluk)
      : undefined;
    const updated: MasterRecord = {
      ...(rows[index] as MasterRecord),
      ...payload,
      division_name: parentDivision?.name ?? rows[index]?.division_name ?? null,
      district_name: parentDistrict?.name ?? parentTaluk?.district_name ?? rows[index]?.district_name ?? null,
      taluk_name: parentTaluk?.name ?? rows[index]?.taluk_name ?? null,
      updated_at: new Date().toISOString(),
    };
    rows[index] = updated;
    return updated;
  },

  async deleteMaster(resource, id) {
    await delay(320);
    const rows = masterStore[mockMasterKey(resource)];
    const record = rows.find((r) => r.id === id);
    if (!record) throw new ApiError("Record not found.", 404);
    record.is_active = false;
    record.updated_at = new Date().toISOString();
  },

  async listInstitutions(params) {
    await delay(280);
    let rows = [...db.institutions];
    if (params.search) {
      const q = String(params.search);
      rows = rows.filter((r) => matches(r.name, q) || matches(r.code, q));
    }
    if (params.is_active !== undefined && params.is_active !== "") {
      const active = String(params.is_active) === "true";
      rows = rows.filter((r) => (r.is_active !== false) === active);
    }
    (
      ["institution_type", "category", "district", "taluk", "site_status", "academic_year"] as const
    ).forEach((key) => {
      const value = params[key];
      if (value) rows = rows.filter((r) => String(r[key] ?? "") === String(value));
    });
    return paginate(
      sortRows(rows as unknown as Record<string, unknown>[], params.ordering) as unknown as Institution[],
      params,
    );
  },

  async getInstitution(id) {
    await delay(240);
    const found = db.institutions.find((i) => i.id === id);
    if (!found) throw new ApiError("Institution not found.", 404);
    return found;
  },

  async createInstitution(payload) {
    await delay(380);
    const record = {
      id: Math.max(0, ...db.institutions.map((i) => i.id)) + 1,
      code: payload.code || `KRICS/${String(db.institutions.length + 1).padStart(4, "0")}`,
      name: payload.name,
      is_active: payload.is_active !== false,
      institution_type: payload.institution_type ?? null,
      category: payload.category ?? null,
      division: payload.division ?? null,
      district: payload.district ?? null,
      taluk: payload.taluk ?? null,
      constituency: payload.constituency ?? null,
      hobli: payload.hobli ?? null,
      academic_year: payload.academic_year ?? null,
      institution_type_name: payload.institution_type_name ?? String(payload.institution_type ?? ""),
      category_name: payload.category_name ?? String(payload.category ?? ""),
      district_name: payload.district_name ?? String(payload.district ?? ""),
      taluk_name: payload.taluk_name ?? String(payload.taluk ?? ""),
      site_status: payload.site_status ?? "available",
      site_details: payload.site_details ?? "",
      student_capacity: payload.student_capacity ?? null,
      source_file: "manual",
      source_sheet: "—",
      source_row: null,
      raw_data: {},
      updated_at: new Date().toISOString(),
    } as Institution;
    db.institutions.unshift(record);
    return record;
  },

  async updateInstitution(id, payload) {
    await delay(360);
    const index = db.institutions.findIndex((i) => i.id === id);
    if (index < 0) throw new ApiError("Institution not found.", 404);
    const current = db.institutions[index] as Institution;
    const updated = {
      ...current,
      ...payload,
      institution_type_name: payload.institution_type_name ?? payload.institution_type ?? current.institution_type_name,
      category_name: payload.category_name ?? payload.category ?? current.category_name,
      district_name: payload.district_name ?? payload.district ?? current.district_name,
      taluk_name: payload.taluk_name ?? payload.taluk ?? current.taluk_name,
    } as Institution;
    db.institutions[index] = updated;
    return updated;
  },

  async deleteInstitution(id) {
    await delay(300);
    const found = db.institutions.find((i) => i.id === id);
    if (!found) throw new ApiError("Institution not found.", 404);
    found.is_active = false;
  },

  async listWorks(params) {
    await delay(300);
    let rows = [...db.works];
    if (params.search) {
      const q = String(params.search);
      rows = rows.filter(
        (r) =>
          matches(r.name, q) ||
          matches(r.code, q) ||
          matches(r.contractor, q) ||
          matches(r.approval_reference, q),
      );
    }
    (["district", "taluk", "category", "academic_year", "scheme", "agency", "status"] as const).forEach(
      (key) => {
        const value = params[key];
        if (value) rows = rows.filter((r) => String(r[key] ?? "") === String(value));
      },
    );
    if (params.is_active !== undefined && params.is_active !== "") {
      const active = String(params.is_active) === "true";
      rows = rows.filter((r) => (r.is_active !== false) === active);
    }
    if (params.kkrdb !== undefined && params.kkrdb !== "")
      rows = rows.filter((r) => r.is_kkrdb === (String(params.kkrdb) === "true"));
    if (params.progress_min !== undefined && params.progress_min !== "")
      rows = rows.filter((r) => (r.physical_progress ?? 0) >= Number(params.progress_min));
    if (params.progress_max !== undefined && params.progress_max !== "")
      rows = rows.filter((r) => (r.physical_progress ?? 0) <= Number(params.progress_max));
    if (params.date_from)
      rows = rows.filter(
        (r) => r.work_order_date && new Date(r.work_order_date) >= new Date(String(params.date_from)),
      );
    if (params.date_to)
      rows = rows.filter(
        (r) => r.work_order_date && new Date(r.work_order_date) <= new Date(String(params.date_to)),
      );
    return paginate(
      sortRows(rows as unknown as Record<string, unknown>[], params.ordering) as unknown as Work[],
      params,
    );
  },

  async getWork(id) {
    await delay(240);
    const found = db.works.find((w) => w.id === id);
    if (!found) throw new ApiError("Work not found.", 404);
    return found;
  },

  async createWork(payload) {
    await delay(400);
    const record = {
      id: Math.max(0, ...db.works.map((w) => w.id)) + 1,
      code: payload.code || `WRK/${String(db.works.length + 1).padStart(5, "0")}`,
      name: payload.name,
      work_type: payload.work_type ?? "New school block",
      institution: payload.institution ?? null,
      category: payload.category ?? null,
      district: payload.district ?? null,
      taluk: payload.taluk ?? null,
      constituency: payload.constituency ?? null,
      academic_year: payload.academic_year ?? null,
      scheme: payload.scheme ?? null,
      agency: payload.agency ?? null,
      status: payload.status ?? null,
      district_name: payload.district_name ?? String(payload.district ?? ""),
      taluk_name: payload.taluk_name ?? null,
      category_name: payload.category_name ?? String(payload.category ?? ""),
      status_name: payload.status_name ?? String(payload.status ?? ""),
      approval_reference: payload.approval_reference ?? "",
      contractor_name: payload.contractor_name ?? "",
      estimate_amount_lakh: payload.estimate_amount_lakh ?? null,
      contract_amount_lakh: payload.contract_amount_lakh ?? null,
      revised_amount_lakh: payload.revised_amount_lakh ?? null,
      financial_progress_lakh: payload.financial_progress_lakh ?? null,
      physical_progress_percent: payload.physical_progress_percent ?? 0,
      work_order_date: payload.work_order_date ?? null,
      site_handover_date: payload.site_handover_date ?? null,
      start_date: payload.start_date ?? null,
      due_date: payload.due_date ?? null,
      extension_date: payload.extension_date ?? null,
      completion_date: payload.completion_date ?? null,
      site_details: payload.site_details ?? "",
      progress_details: payload.progress_details ?? "",
      remarks: payload.remarks ?? "",
      source_file: "manual",
      source_sheet: "—",
      source_row: null,
      raw_data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Work;
    db.works.unshift(record);
    return record;
  },

  async updateWork(id, payload) {
    await delay(360);
    const index = db.works.findIndex((w) => w.id === id);
    if (index < 0) throw new ApiError("Work not found.", 404);
    const current = db.works[index] as Work;
    const updated = {
      ...current,
      ...payload,
      district_name: payload.district_name ?? payload.district ?? current.district_name,
      category_name: payload.category_name ?? payload.category ?? current.category_name,
      status_name: payload.status_name ?? payload.status ?? current.status_name,
      updated_at: new Date().toISOString(),
    } as Work;
    db.works[index] = updated;
    return updated;
  },

  async deleteWork(id) {
    await delay(300);
    const found = db.works.find((w) => w.id === id);
    if (!found) throw new ApiError("Work not found.", 404);
    found.is_active = false;
  },

  async getDashboardSummary(params) {
    await delay(420);
    let works = [...db.works];
    let institutions = [...db.institutions];
    if (params.district) {
      works = works.filter((w) => w.district === params.district);
      institutions = institutions.filter((i) => i.district === params.district);
    }
    if (params.category) {
      works = works.filter((w) => w.category === params.category);
      institutions = institutions.filter((i) => i.category === params.category);
    }
    if (params.academic_year) {
      works = works.filter((w) => w.academic_year === params.academic_year);
    }

    const countType = (type: string) =>
      institutions.filter((i) => i.institution_type === type).length;
    const byStatus = (status: WorkStatusKey) => works.filter((w) => w.status === status).length;

    const districtWorks = db.districtNames
      .map((district) => ({
        district,
        works: works.filter((w) => w.district === district).length,
      }))
      .filter((d) => d.works > 0)
      .sort((a, b) => b.works - a.works);

    const progressByDistrict = districtWorks.slice(0, 8).map(({ district }) => {
      const subset = works.filter((w) => w.district === district);
      return {
        district,
        financial_lakh: Number(
          subset.reduce((sum, w) => sum + (w.financial_progress ?? 0), 0).toFixed(2),
        ),
        physical_pct: Number(
          (subset.reduce((sum, w) => sum + (w.physical_progress ?? 0), 0) / (subset.length || 1)).toFixed(1),
        ),
      };
    });

    const totals = {
      institutions: institutions.length,
      residential_schools: countType("Residential School"),
      hostels: countType("Hostel"),
      pu_colleges: countType("PU College"),
      works: works.length,
      ongoing_works: byStatus("ongoing"),
      completed_works: byStatus("completed"),
      site_problem_records: institutions.filter((i) => i.site_status === "problem").length,
    };

    const site_snapshot = {
      available: institutions.filter((i) => i.site_status === "available").length,
      not_available: institutions.filter((i) => i.site_status === "not_available").length,
      problem: institutions.filter((i) => i.site_status === "problem").length,
    };

    return {
      kpi_metrics: [
        { key: "institutions", label: "Total Institutions", value: totals.institutions },
        { key: "residential_schools", label: "Residential Schools", value: totals.residential_schools },
        { key: "hostels", label: "Hostels", value: totals.hostels },
        { key: "pu_colleges", label: "PU Colleges", value: totals.pu_colleges },
        { key: "works", label: "Total Works", value: totals.works },
        { key: "ongoing_works", label: "Ongoing Works", value: totals.ongoing_works },
        { key: "completed_works", label: "Completed Works", value: totals.completed_works },
        { key: "site_problem_records", label: "Site Problems", value: totals.site_problem_records },
      ],
      totals,
      previous_period: {
        institutions: Math.round(totals.institutions * 0.94),
        works: Math.round(totals.works * 0.91),
        ongoing_works: Math.round(totals.ongoing_works * 1.06),
        completed_works: Math.round(totals.completed_works * 0.83),
        site_problem_records: Math.round(totals.site_problem_records * 1.12),
      },
      work_status_distribution: WORK_STATUS_KEYS.map((status) => ({
        status,
        count: byStatus(status),
      })),
      district_works: districtWorks,
      progress_by_district: progressByDistrict,
      recent_works: [...works]
        .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
        .slice(0, 8)
        .map((w) => ({
          id: w.id,
          name: w.name,
          district: w.district,
          status: w.status,
          physical_progress: w.physical_progress,
          updated_at: w.updated_at,
        })),
      site_snapshot,
      site_cards: [
        { status: "available", label: "Site Available", count: site_snapshot.available },
        { status: "not_available", label: "Site Not Available", count: site_snapshot.not_available },
        { status: "problem", label: "Site Problems", count: site_snapshot.problem },
      ],
    } satisfies DashboardSummary;
  },

  async getReport(slug, params) {
    await delay(280);
    const works = filterWorks(params ?? {});
    return {
      slug,
      title: "KRICS Abstract Report",
      title_kn: "ಕೃಷ್ಣಾ ಭವನ ನಿರ್ಮಾಣ ಸಂಸ್ಥೆ - ಅಮೂರ್ತ ವರದಿ",
      subtitle: "Mock report (connect real API for live data)",
      subtitle_kn: "",
      generated_at: new Date().toISOString(),
      group_by: String(params?.group_by || "district"),
      group_by_options: [
        { value: "district", label: "District", label_kn: "ಜಿಲ್ಲೆ" },
        { value: "division", label: "Division", label_kn: "ವಿಭಾಗ" },
        { value: "category", label: "Category", label_kn: "ವರ್ಗ" },
      ],
      filters_applied: [],
      available_fields: [
        { key: "group", label: "District", label_kn: "ಜಿಲ್ಲೆ", type: "text" },
        { key: "works", label: "No. of Works", label_kn: "ಕಾಮಗಾರಿಗಳು", type: "number" },
        { key: "estimate_lakh", label: "Estimate (Lakh)", label_kn: "ಅಂದಾಜು", type: "number" },
      ],
      columns: [
        { key: "sl_no", label: "SI NO", label_kn: "ಕ್ರ.ಸಂ", type: "number" },
        { key: "group", label: "District", label_kn: "ಜಿಲ್ಲೆ", type: "text" },
        { key: "works", label: "No. of Works", label_kn: "ಕಾಮಗಾರಿಗಳು", type: "number" },
        { key: "estimate_lakh", label: "Estimate (Lakh)", label_kn: "ಅಂದಾಜು", type: "number" },
      ],
      rows: [
        { sl_no: 1, group: "Belagavi", works: works.length, estimate_lakh: sum(works.map((w) => w.estimate_amount_lakh ?? 0)) },
      ],
      totals: { works: works.length, estimate_lakh: sum(works.map((w) => w.estimate_amount_lakh ?? 0)) },
      row_count: 1,
    };
  },

  async exportReport(slug, format) {
    await delay(200);
    const blob = new Blob([`KRICS mock ${slug} ${format} export`], {
      type: format === "excel" ? "application/vnd.ms-excel" : "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KRICS_${slug}_mock.${format === "excel" ? "xlsx" : "docx"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  async getWorksSummary(params) {
    await delay(360);
    const works = filterWorks(params);
    return {
      by_status: WORK_STATUS_KEYS.map((status) => ({
        status,
        count: works.filter((w) => w.status === status).length,
      })),
      total_estimate_lakh: sum(works.map((w) => w.estimate_amount)),
      total_contract_lakh: sum(works.map((w) => w.contract_amount)),
      total_financial_progress_lakh: sum(works.map((w) => w.financial_progress)),
      average_physical_progress: avg(works.map((w) => w.physical_progress)),
    } satisfies WorksSummaryReport;
  },

  async getDistrictSummary(params) {
    await delay(360);
    const works = filterWorks(params);
    return db.districtNames
      .map((district) => {
        const subset = works.filter((w) => w.district === district);
        const insts = db.institutions.filter((i) => i.district === district);
        return {
          district,
          institutions: insts.length,
          works: subset.length,
          ongoing: subset.filter((w) => w.status === "ongoing").length,
          completed: subset.filter((w) => w.status === "completed").length,
          site_problems: insts.filter((i) => i.site_status === "problem").length,
          estimate_lakh: sum(subset.map((w) => w.estimate_amount)),
          financial_progress_lakh: sum(subset.map((w) => w.financial_progress)),
          average_physical_progress: avg(subset.map((w) => w.physical_progress)),
        } satisfies DistrictSummaryRow;
      })
      .filter((row) => row.works > 0 || row.institutions > 0);
  },

  async getCategorySummary(params) {
    await delay(340);
    const works = filterWorks(params);
    return db.categoryNames.map((category) => {
      const subset = works.filter((w) => w.category === category);
      return {
        category,
        institutions: db.institutions.filter((i) => i.category === category).length,
        works: subset.length,
        estimate_lakh: sum(subset.map((w) => w.estimate_amount)),
        financial_progress_lakh: sum(subset.map((w) => w.financial_progress)),
        average_physical_progress: avg(subset.map((w) => w.physical_progress)),
      } satisfies CategorySummaryRow;
    });
  },

  async getFinancialProgress(params) {
    await delay(340);
    const works = filterWorks(params);
    const groupBy = String(params.group_by ?? "district");
    const keyOf = (w: Work) =>
      groupBy === "category"
        ? w.category
        : groupBy === "year"
          ? (w.academic_year ?? "—")
          : groupBy === "agency"
            ? (w.agency ?? "—")
            : w.district;
    const groups = Array.from(new Set(works.map(keyOf)));
    return groups
      .map((group) => {
        const subset = works.filter((w) => keyOf(w) === group);
        return {
          group,
          estimate_lakh: sum(subset.map((w) => w.estimate_amount)),
          contract_lakh: sum(subset.map((w) => w.contract_amount)),
          revised_lakh: sum(subset.map((w) => w.revised_amount)),
          financial_progress_lakh: sum(subset.map((w) => w.financial_progress)),
        } satisfies FinancialProgressRow;
      })
      .sort((a, b) => b.estimate_lakh - a.estimate_lakh);
  },

  async getPhysicalProgress(params) {
    await delay(340);
    const works = filterWorks(params);
    const bucketOf = (p: number) =>
      p >= 100 ? "100%" : p >= 75 ? "75–99%" : p >= 50 ? "50–75%" : p >= 25 ? "25–50%" : "Below 25%";
    const buckets = ["Below 25%", "25–50%", "50–75%", "75–99%", "100%"].map((bucket) => ({
      bucket,
      count: works.filter((w) => bucketOf(w.physical_progress ?? 0) === bucket).length,
    }));
    const rows = db.districtNames
      .map((district) => {
        const subset = works.filter((w) => w.district === district);
        return {
          group: district,
          works: subset.length,
          average_physical_progress: avg(subset.map((w) => w.physical_progress)),
        };
      })
      .filter((r) => r.works > 0);
    return { buckets, rows } satisfies PhysicalProgressReport;
  },

  async getInstitutionCoverage(params) {
    await delay(320);
    let insts = [...db.institutions];
    if (params.district) insts = insts.filter((i) => i.district === params.district);
    if (params.category) insts = insts.filter((i) => i.category === params.category);
    return {
      by_type: db.institutionTypeNames.map((type) => ({
        type,
        count: insts.filter((i) => i.institution_type === type).length,
      })),
      site: {
        available: insts.filter((i) => i.site_status === "available").length,
        not_available: insts.filter((i) => i.site_status === "not_available").length,
        problem: insts.filter((i) => i.site_status === "problem").length,
      },
      districts: db.districtNames.map((district) => {
        const subset = insts.filter((i) => i.district === district);
        return {
          district,
          institutions: subset.length,
          taluks: new Set(subset.map((i) => i.taluk)).size,
          hoblis: new Set(subset.map((i) => i.hobli)).size,
        };
      }),
    } satisfies InstitutionCoverageReport;
  },

  async uploadExcel(files) {
    await delay(1400);
    const rowsSeen = files.length * 480;
    const batch = db.importBatches[0] as ImportBatch;
    return {
      batch_ref: batch.batch_ref,
      batch_id: batch.id,
      files_processed: files.length,
      rows_seen: rowsSeen,
      rows_imported: rowsSeen - 6,
      institutions_upserted: Math.round(rowsSeen * 0.18),
      works_upserted: Math.round(rowsSeen * 0.42),
      masters_created: 4,
      raw_rows_archived: rowsSeen,
      errors: [
        {
          file: files[0]?.name ?? "workbook.xlsx",
          sheet: "Works",
          row: 128,
          message: "Estimate amount is not numeric.",
        },
      ],
      warnings: [
        "Merged header cells detected in sheet 'Works'.",
        "3 summary rows were skipped.",
        "2 district values were matched approximately.",
        "1 duplicate work code was updated instead of created.",
      ],
    } satisfies ImportResult;
  },

  async listBatches(params) {
    await delay(260);
    let rows = [...db.importBatches];
    if (params.search) {
      const q = String(params.search);
      rows = rows.filter((b) => matches(b.batch_ref, q) || matches(b.source, q));
    }
    return paginate(rows, params);
  },

  async getBatch(id) {
    await delay(220);
    const found = db.importBatches.find((b) => b.id === id);
    if (!found) throw new ApiError("Import batch not found.", 404);
    return found;
  },

  async listAuditRows(params) {
    await delay(260);
    let rows: ImportedRow[] = [...db.importedRows];
    if (params.search) {
      const q = String(params.search);
      rows = rows.filter((r) => matches(r.source_file, q) || matches(r.sheet, q));
    }
    if (params.entity_type) rows = rows.filter((r) => r.entity_type === params.entity_type);
    if (params.row_number)
      rows = rows.filter((r) => String(r.row_number) === String(params.row_number));
    return paginate(rows, params);
  },

  async listMenus(params) {
    await delay(160);
    return accessStore.listMenus(params);
  },
  async createMenu(payload) {
    await delay(180);
    return accessStore.createMenu(payload);
  },
  async updateMenu(id, payload) {
    await delay(180);
    return accessStore.updateMenu(id, payload);
  },
  async deleteMenu(id) {
    await delay(160);
    accessStore.deleteMenu(id);
  },
  async listRoles(params) {
    await delay(160);
    return accessStore.listRoles(params);
  },
  async createRole(payload) {
    await delay(180);
    return accessStore.createRole(payload);
  },
  async updateRole(id, payload) {
    await delay(180);
    return accessStore.updateRole(id, payload);
  },
  async deleteRole(id) {
    await delay(160);
    accessStore.deleteRole(id);
  },
  async updateRoleAccess(id, access) {
    await delay(180);
    return accessStore.updateRoleAccess(id, access);
  },
  async listUsers(params) {
    await delay(160);
    return accessStore.listUsers(params);
  },
  async createUser(payload) {
    await delay(180);
    return accessStore.createUser(payload);
  },
  async updateUser(id, payload) {
    await delay(180);
    return accessStore.updateUser(id, payload);
  },
  async deleteUser(id) {
    await delay(160);
    accessStore.deleteUser(id);
  },
};

function filterWorks(params: ListParams): Work[] {
  let works = [...db.works];
  (["district", "category", "academic_year", "agency", "status"] as const).forEach((key) => {
    const value = params[key];
    if (value) works = works.filter((w) => String(w[key] ?? "") === String(value));
  });
  return works;
}

function sum(values: (number | null | undefined)[]): number {
  return Number(values.reduce<number>((acc, v) => acc + (v ?? 0), 0).toFixed(2));
}

function avg(values: (number | null | undefined)[]): number {
  if (!values.length) return 0;
  return Number((values.reduce<number>((acc, v) => acc + (v ?? 0), 0) / values.length).toFixed(1));
}
