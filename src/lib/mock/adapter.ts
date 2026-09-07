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

export const mockAdapter: ApiAdapter = {
  mode: "mock",

  async listMasters(resource, params) {
    await delay(220);
    let rows = [...(masterStore[resource] ?? [])];
    if (params.search) {
      const q = String(params.search);
      rows = rows.filter((r) => matches(r.name, q) || matches(r.code, q));
    }
    if (params.is_active !== undefined && params.is_active !== "") {
      const active = String(params.is_active) === "true";
      rows = rows.filter((r) => r.is_active === active);
    }
    if (params.district) rows = rows.filter((r) => String(r.district) === String(params.district));
    return paginate(sortRows(rows as unknown as Record<string, unknown>[], params.ordering) as unknown as MasterRecord[], params);
  },

  async createMaster(resource, payload) {
    await delay(400);
    const rows = masterStore[resource];
    if (rows.some((r) => r.name.toLowerCase() === payload.name.toLowerCase())) {
      throw new ApiError("Validation failed.", 400, {
        name: ["A record with this name already exists."],
      });
    }
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

  async updateMaster(resource, id, payload) {
    await delay(380);
    const rows = masterStore[resource];
    const index = rows.findIndex((r) => r.id === id);
    if (index < 0) throw new ApiError("Record not found.", 404);
    const parentDistrict = payload.district
      ? masterStore.districts.find((d) => d.id === payload.district)
      : undefined;
    const parentTaluk = payload.taluk
      ? masterStore.taluks.find((t) => t.id === payload.taluk)
      : undefined;
    const updated: MasterRecord = {
      ...(rows[index] as MasterRecord),
      ...payload,
      district_name: parentDistrict?.name ?? parentTaluk?.district_name ?? rows[index]?.district_name ?? null,
      taluk_name: parentTaluk?.name ?? rows[index]?.taluk_name ?? null,
      updated_at: new Date().toISOString(),
    };
    rows[index] = updated;
    return updated;
  },

  async deleteMaster(resource, id) {
    await delay(320);
    const rows = masterStore[resource];
    const record = rows.find((r) => r.id === id);
    if (!record) throw new ApiError("Record not found.", 404);
    if ((record.reference_count ?? 0) > 0) {
      throw new ApiError(
        `This record is referenced by ${record.reference_count} other records and cannot be deleted.`,
        409,
      );
    }
    masterStore[resource] = rows.filter((r) => r.id !== id);
  },

  async listInstitutions(params) {
    await delay(280);
    let rows = [...db.institutions];
    if (params.search) {
      const q = String(params.search);
      rows = rows.filter((r) => matches(r.name, q) || matches(r.code, q));
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

    return {
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
      site_snapshot: {
        available: institutions.filter((i) => i.site_status === "available").length,
        not_available: institutions.filter((i) => i.site_status === "not_available").length,
        problem: institutions.filter((i) => i.site_status === "problem").length,
      },
    } satisfies DashboardSummary;
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
