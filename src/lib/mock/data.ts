/**
 * DEVELOPMENT-ONLY mock dataset.
 * Used only when VITE_API_BASE_URL is not configured. No UI component may
 * import this module directly — it is reachable exclusively through the mock
 * API adapter in src/lib/mock/adapter.ts.
 */
import type { MasterRecord, MasterResource } from "@/types/masters";
import type { Institution, SiteStatus } from "@/types/institutions";
import type { Work, WorkStatusKey } from "@/types/works";
import { WORK_STATUS_KEYS } from "@/types/works";
import type { ImportBatch, ImportedRow } from "@/types/imports";

let seed = 20260907;
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function pick<T>(items: T[]): T {
  return items[Math.floor(rnd() * items.length)] as T;
}
function int(min: number, max: number): number {
  return Math.floor(min + rnd() * (max - min + 1));
}
function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

const DISTRICTS = [
  "Bengaluru Urban",
  "Belagavi",
  "Kalaburagi",
  "Mysuru",
  "Ballari",
  "Vijayapura",
  "Tumakuru",
  "Raichur",
  "Dharwad",
  "Hassan",
  "Bidar",
  "Koppal",
];
const DIVISIONS = ["Bengaluru", "Belagavi", "Kalaburagi", "Mysuru"];
const CATEGORIES = ["SC", "ST", "BC", "General", "Minority"];
const INSTITUTION_TYPES = ["Residential School", "Hostel", "PU College", "Composite Campus"];
const AGENCIES = ["KRIDL", "PWD", "Nirmithi Kendra", "KKRDB", "Zilla Panchayat"];
const SCHEMES = ["SCSP", "TSP", "KKRDB Micro", "State Sector", "NABARD RIDF"];
const YEARS = ["2022-23", "2023-24", "2024-25", "2025-26"];
const WORK_TYPES = [
  "New school block",
  "Hostel building",
  "Compound wall",
  "Toilet block",
  "Kitchen & dining hall",
  "Borewell & water supply",
  "Renovation",
];
const CONTRACTORS = [
  "Shree Constructions",
  "Vishwa Builders",
  "Sahyadri Infra",
  "Karnataka Civil Works",
  "Hampi Engineering",
];

function taluksFor(district: string): string[] {
  return [`${district} North`, `${district} South`, `${district} Rural`];
}

function makeMasters(): Record<Exclude<MasterResource, "caste-categories">, MasterRecord[]> {
  const mk = (names: string[], prefix: string): MasterRecord[] =>
    names.map((name, i) => ({
      id: i + 1,
      name,
      code: `${prefix}${String(i + 1).padStart(3, "0")}`,
      is_active: i % 11 !== 7,
      created_at: isoDaysAgo(400 - i),
      updated_at: isoDaysAgo(30 - (i % 30)),
      reference_count: int(0, 12),
    }));

  const districts = mk(DISTRICTS, "DST");
  const taluks: MasterRecord[] = [];
  districts.forEach((d) => {
    taluksFor(d.name).forEach((t) => {
      taluks.push({
        id: taluks.length + 1,
        name: t,
        code: `TLK${String(taluks.length + 1).padStart(3, "0")}`,
        is_active: true,
        district: d.id,
        district_name: d.name,
        created_at: isoDaysAgo(380),
        updated_at: isoDaysAgo(20),
        reference_count: int(0, 8),
      });
    });
  });

  const constituencies = DISTRICTS.flatMap((d, i) =>
    [`${d} City`, `${d} Rural`].map((name, j) => ({
      id: i * 2 + j + 1,
      name,
      code: `CON${String(i * 2 + j + 1).padStart(3, "0")}`,
      is_active: true,
      district: i + 1,
      district_name: d,
      created_at: isoDaysAgo(360),
      updated_at: isoDaysAgo(15),
      reference_count: int(0, 6),
    })),
  );

  const hoblis = taluks.slice(0, 24).map((t, i) => ({
    id: i + 1,
    name: `${t.name} Hobli`,
    code: `HOB${String(i + 1).padStart(3, "0")}`,
    is_active: true,
    taluk: t.id,
    taluk_name: t.name,
    district: t.district ?? null,
    district_name: t.district_name ?? null,
    created_at: isoDaysAgo(340),
    updated_at: isoDaysAgo(12),
    reference_count: int(0, 4),
  }));

  return {
    divisions: mk(DIVISIONS, "DIV"),
    districts,
    taluks,
    constituencies,
    hoblis,
    categories: mk(CATEGORIES, "CAT"),
    "institution-types": mk(INSTITUTION_TYPES, "ITY"),
    agencies: mk(AGENCIES, "AGY"),
    schemes: mk(SCHEMES, "SCH"),
    "academic-years": mk(YEARS, "AYR"),
    "work-statuses": mk(
      ["Ongoing", "Completed", "Tender stage", "Estimate stage", "Site problem", "Not started", "Handed over"],
      "WST",
    ),
  };
}

function makeInstitutions(): Institution[] {
  const list: Institution[] = [];
  for (let i = 1; i <= 240; i++) {
    const district = pick(DISTRICTS);
    const taluk = pick(taluksFor(district));
    const type = pick(INSTITUTION_TYPES);
    const status = pick<SiteStatus>(["available", "available", "not_available", "problem"]);
    list.push({
      id: i,
      code: `KRICS/${String(i).padStart(4, "0")}`,
      name: `${district} ${type} - Unit ${i}`,
      institution_type: type,
      category: pick(CATEGORIES),
      division: pick(DIVISIONS),
      district,
      taluk,
      constituency: `${district} ${i % 2 ? "City" : "Rural"}`,
      hobli: `${taluk} Hobli`,
      academic_year: pick(YEARS),
      is_active: true,
      site_status: status,
      site_details:
        status === "problem"
          ? "Encroachment reported on the allotted survey number; revenue clearance pending."
          : status === "available"
            ? "Land handed over by revenue department; boundary marked."
            : "Site identification in progress with the Tahsildar office.",
      survey_details: `Sy. No. ${int(10, 240)}/${int(1, 9)} — ${(rnd() * 6 + 1).toFixed(2)} acres`,
      student_capacity: int(50, 500),
      source_file: `institutions_${pick(YEARS).replace("-", "_")}.xlsx`,
      source_sheet: pick(["Sheet1", "Institutions", "Master"]),
      source_row: int(2, 900),
      source_json: {
        "Institution Name": `${district} ${type} - Unit ${i}`,
        District: district,
        Taluk: taluk,
        "Site Status": status,
        Capacity: String(int(50, 500)),
      },
      updated_at: isoDaysAgo(int(1, 120)),
    });
  }
  return list;
}

function makeWorks(institutions: Institution[]): Work[] {
  const list: Work[] = [];
  for (let i = 1; i <= 420; i++) {
    const inst = pick(institutions);
    const status = pick<WorkStatusKey>([
      "ongoing",
      "ongoing",
      "ongoing",
      "completed",
      "completed",
      "tender_stage",
      "estimate_stage",
      "site_problem",
      "not_started",
      "handed_over",
    ]);
    const estimate = Number((rnd() * 480 + 20).toFixed(2));
    const contract = Number((estimate * (0.88 + rnd() * 0.15)).toFixed(2));
    const revised = rnd() > 0.7 ? Number((contract * (1 + rnd() * 0.2)).toFixed(2)) : null;
    const physical =
      status === "completed" || status === "handed_over"
        ? 100
        : status === "ongoing"
          ? int(10, 95)
          : status === "site_problem"
            ? int(0, 30)
            : 0;
    const financial = Number(((contract * physical) / 100).toFixed(2));
    const orderDate = physical > 0 || status === "ongoing" ? isoDaysAgo(int(60, 900)) : null;
    list.push({
      id: i,
      code: `WRK/${String(i).padStart(5, "0")}`,
      name: `${pick(WORK_TYPES)} at ${inst.name}`,
      work_type: pick(WORK_TYPES),
      institution: inst.name,
      institution_id: inst.id,
      district: inst.district,
      taluk: inst.taluk,
      constituency: inst.constituency,
      category: inst.category,
      academic_year: pick(YEARS),
      scheme: pick(SCHEMES),
      agency: pick(AGENCIES),
      status,
      is_active: true,
      is_kkrdb: rnd() > 0.75,
      estimate_amount: estimate,
      contract_amount: contract,
      revised_amount: revised,
      financial_progress: financial,
      physical_progress: physical,
      work_order_date: orderDate,
      site_handover_date: orderDate ? isoDaysAgo(int(50, 850)) : null,
      start_date: orderDate ? isoDaysAgo(int(40, 800)) : null,
      due_date: isoDaysAgo(-int(10, 400)),
      extension_date: rnd() > 0.8 ? isoDaysAgo(-int(20, 200)) : null,
      completion_date: physical === 100 ? isoDaysAgo(int(5, 300)) : null,
      approval_reference: `KRICS/APR/${int(2022, 2026)}/${int(100, 999)}`,
      contractor: pick(CONTRACTORS),
      site_details:
        status === "site_problem"
          ? "Work stalled — litigation on the allotted land parcel; district office pursuing resolution."
          : "Site available and handed over to the executing agency.",
      progress_details:
        physical === 100
          ? "All civil, electrical and plumbing items completed. Building handed over for use."
          : `Foundation and plinth completed. Superstructure at ${physical}% with block work in progress.`,
      remarks: rnd() > 0.6 ? "Monthly progress review pending with the executive engineer." : null,
      source_file: `works_${pick(YEARS).replace("-", "_")}.xlsx`,
      source_sheet: pick(["Works", "Ongoing", "Sheet2"]),
      source_row: int(2, 1200),
      source_json: {
        "Work Name": `${pick(WORK_TYPES)} at ${inst.name}`,
        District: inst.district,
        Status: status,
        "Estimate (Lakh)": String(estimate),
      },
      updated_at: isoDaysAgo(int(0, 60)),
    });
  }
  return list;
}

function makeBatches(): ImportBatch[] {
  return Array.from({ length: 12 }).map((_, i) => {
    const errors = int(0, 5);
    const rows = int(200, 2400);
    return {
      id: i + 1,
      batch_ref: `BATCH-2026-${String(i + 1).padStart(3, "0")}`,
      started_at: isoDaysAgo(i * 3 + 1),
      completed_at: isoDaysAgo(i * 3 + 0.9),
      source: pick(["Manual upload", "District office", "Scheduled sync"]),
      file_count: int(1, 5),
      row_count: rows,
      rows_imported: rows - errors * int(1, 10),
      institutions_upserted: int(10, 200),
      works_upserted: int(20, 400),
      masters_created: int(0, 14),
      raw_rows_archived: rows,
      error_count: errors,
      warning_count: int(0, 9),
      status: errors > 0 ? "completed_with_warnings" : "completed",
      file_errors: Array.from({ length: errors }).map((__, j) => ({
        file: `works_2024_25.xlsx`,
        sheet: "Works",
        row: int(2, 800),
        message: pick([
          "Estimate amount is not numeric.",
          "District value could not be matched to a master record.",
          "Merged header cell detected; column mapping is ambiguous.",
          "Duplicate work code in the same sheet.",
        ]) + ` (row issue ${j + 1})`,
      })),
    };
  });
}

function makeImportedRows(batches: ImportBatch[]): ImportedRow[] {
  const rows: ImportedRow[] = [];
  batches.slice(0, 6).forEach((b) => {
    for (let i = 0; i < 30; i++) {
      const entity = pick<ImportedRow["entity_type"]>(["institution", "work", "raw"]);
      rows.push({
        id: rows.length + 1,
        batch_ref: b.batch_ref,
        source_file: pick(["institutions_2024_25.xlsx", "works_2024_25.xlsx", "kkrdb_works.xls"]),
        sheet: pick(["Sheet1", "Works", "Institutions"]),
        row_number: int(2, 900),
        entity_type: entity,
        raw_json: {
          "Sl No": String(i + 1),
          District: pick(DISTRICTS),
          Name: `${pick(WORK_TYPES)} block`,
          Amount: String((rnd() * 200).toFixed(2)),
        },
        normalized_json: {
          district: pick(DISTRICTS),
          entity_type: entity,
          estimate_amount: Number((rnd() * 200).toFixed(2)),
        },
        created_at: b.started_at,
      });
    }
  });
  return rows;
}

export const masters = makeMasters();
export const institutions = makeInstitutions();
export const works = makeWorks(institutions);
export const importBatches = makeBatches();
export const importedRows = makeImportedRows(importBatches);
export const districtNames = DISTRICTS;
export const categoryNames = CATEGORIES;
export const institutionTypeNames = INSTITUTION_TYPES;
export const agencyNames = AGENCIES;
export const schemeNames = SCHEMES;
export const academicYearNames = YEARS;
export { taluksFor };
