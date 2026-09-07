export interface MasterRecord {
  id: number;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  /** Relational fields used by specific master resources. */
  district?: number | null;
  district_name?: string | null;
  taluk?: number | null;
  taluk_name?: string | null;
  reference_count?: number;
}

export type MasterResource =
  | "divisions"
  | "districts"
  | "taluks"
  | "constituencies"
  | "hoblis"
  | "categories"
  | "institution-types"
  | "agencies"
  | "schemes"
  | "academic-years"
  | "work-statuses";

export interface MasterPayload {
  name: string;
  code?: string | null;
  is_active: boolean;
  district?: number | null;
  taluk?: number | null;
}

export interface MasterResourceConfig {
  resource: MasterResource;
  title: string;
  singular: string;
  description: string;
  parent?: "district" | "taluk";
  parentRequired?: boolean;
}

export const MASTER_RESOURCES: MasterResourceConfig[] = [
  {
    resource: "divisions",
    title: "Divisions",
    singular: "Division",
    description: "Administrative divisions used across institutions and works.",
  },
  {
    resource: "districts",
    title: "Districts",
    singular: "District",
    description: "Revenue districts of Karnataka covered by the society.",
  },
  {
    resource: "taluks",
    title: "Taluks",
    singular: "Taluk",
    description: "Taluks mapped to their parent district.",
    parent: "district",
    parentRequired: true,
  },
  {
    resource: "constituencies",
    title: "Constituencies",
    singular: "Constituency",
    description: "Assembly constituencies, optionally linked to a district.",
    parent: "district",
  },
  {
    resource: "hoblis",
    title: "Hoblis",
    singular: "Hobli",
    description: "Hoblis, optionally linked to a taluk. District is derived from the taluk.",
    parent: "taluk",
  },
  {
    resource: "categories",
    title: "Categories",
    singular: "Category",
    description: "Social welfare categories such as SC, ST, BC and General.",
  },
  {
    resource: "institution-types",
    title: "Institution Types",
    singular: "Institution type",
    description: "Residential school, hostel, PU college and other types.",
  },
  {
    resource: "agencies",
    title: "Agencies",
    singular: "Agency",
    description: "Executing agencies responsible for construction works.",
  },
  {
    resource: "schemes",
    title: "Schemes",
    singular: "Scheme",
    description: "Funding schemes under which works are sanctioned.",
  },
  {
    resource: "academic-years",
    title: "Academic Years",
    singular: "Academic year",
    description: "Academic years used for institution and work reporting.",
  },
  {
    resource: "work-statuses",
    title: "Work Statuses",
    singular: "Work status",
    description: "Lifecycle statuses applied to construction works.",
  },
];

export function getMasterConfig(resource: MasterResource): MasterResourceConfig {
  const found = MASTER_RESOURCES.find((m) => m.resource === resource);
  if (!found) throw new Error(`Unknown master resource: ${resource}`);
  return found;
}
