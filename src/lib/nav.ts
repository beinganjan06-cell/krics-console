export interface NavItem {
  label: string;
  to: string;
}

export interface NavGroup {
  kind: "group";
  id: string;
  label: string;
  icon?: string;
  items: NavItem[];
}

export interface NavLeaf {
  kind: "leaf";
  id: string;
  label: string;
  to: string;
  icon?: string;
}

export type NavEntry = NavGroup | NavLeaf;

export const OVERVIEW: NavItem = { label: "Overview", to: "/dashboard" };

export const NAV: NavEntry[] = [
  {
    kind: "group",
    id: "masters",
    label: "Master Management",
    icon: "Database",
    items: [
      { label: "Divisions", to: "/masters/divisions" },
      { label: "Districts", to: "/masters/districts" },
      { label: "Taluks", to: "/masters/taluks" },
      { label: "Constituencies", to: "/masters/constituencies" },
      { label: "Hoblis", to: "/masters/hoblis" },
      { label: "Caste Categories", to: "/masters/caste-categories" },
      { label: "Institution Types", to: "/masters/institution-types" },
      { label: "Agencies", to: "/masters/agencies" },
      { label: "Schemes", to: "/masters/schemes" },
      { label: "Academic Years", to: "/masters/academic-years" },
      { label: "Work Statuses", to: "/masters/work-statuses" },
    ],
  },
  { kind: "leaf", id: "institutions", label: "Institutions", to: "/institutions", icon: "Building2" },
  { kind: "leaf", id: "works", label: "Works Management", to: "/works", icon: "HardHat" },
  {
    kind: "group",
    id: "reports",
    label: "Reports",
    icon: "BarChart3",
    items: [
      { label: "Works Progress Register", to: "/reports/works-summary" },
      { label: "Works Abstract (District)", to: "/reports/district-summary" },
      { label: "Works Abstract (Category)", to: "/reports/category-summary" },
      { label: "Financial Progress", to: "/reports/financial-progress" },
      { label: "Physical Progress", to: "/reports/physical-progress" },
      { label: "Institution / School List", to: "/reports/institution-coverage" },
    ],
  },
  {
    kind: "group",
    id: "admin",
    label: "Administration",
    icon: "Settings",
    items: [
      { label: "User", to: "/administration/users" },
      { label: "Menu", to: "/administration/menus" },
      { label: "Role", to: "/administration/roles" },
    ],
  },
];

function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
}

export function pathMatches(pathname: string, to: string): boolean {
  const n = normalizePath(pathname);
  const t = normalizePath(to);
  return n === t || n.startsWith(`${t}/`);
}

export function findActiveGroup(pathname: string, entries: NavEntry[] = NAV): NavGroup | null {
  return matchNav(pathname, entries).group;
}

export function isNavItemActive(pathname: string, item: NavItem, entries: NavEntry[] = NAV): boolean {
  const match = matchNav(pathname, entries).item;
  return match?.to === item.to;
}

export function isLeafActive(pathname: string, leaf: NavLeaf, entries: NavEntry[] = NAV): boolean {
  const match = matchNav(pathname, entries);
  return match.item?.to === leaf.to;
}

export interface NavMatch {
  group: NavGroup | null;
  item: NavItem | null;
  title: string;
  breadcrumbs: { label: string }[];
}

export function matchNav(pathname: string, entries: NavEntry[] = NAV): NavMatch {
  const n = normalizePath(pathname);
  if (n === "/" || n === "/dashboard") {
    return {
      group: null,
      item: OVERVIEW,
      title: OVERVIEW.label,
      breadcrumbs: [{ label: OVERVIEW.label }],
    };
  }

  const candidates: { group: NavGroup | null; item: NavItem }[] = [];
  for (const entry of entries) {
    if (entry.kind === "leaf") {
      if (pathMatches(n, entry.to)) {
        candidates.push({ group: null, item: { label: entry.label, to: entry.to } });
      }
      continue;
    }
    for (const item of entry.items) {
      if (pathMatches(n, item.to)) candidates.push({ group: entry, item });
    }
  }
  candidates.sort((a, b) => normalizePath(b.item.to).length - normalizePath(a.item.to).length);
  const best = candidates[0];
  if (!best) {
    return { group: null, item: null, title: "", breadcrumbs: [] };
  }
  return {
    group: best.group,
    item: best.item,
    title: best.item.label,
    breadcrumbs: best.group
      ? [{ label: best.group.label }, { label: best.item.label }]
      : [{ label: best.item.label }],
  };
}

export function flattenNavItems(): { group: { id: string; label: string }; item: NavItem }[] {
  const rows: { group: { id: string; label: string }; item: NavItem }[] = [
    { group: { id: "overview", label: "Overview" }, item: OVERVIEW },
  ];
  for (const entry of NAV) {
    if (entry.kind === "leaf") {
      rows.push({
        group: { id: entry.id, label: entry.label },
        item: { label: entry.label, to: entry.to },
      });
      continue;
    }
    for (const item of entry.items) rows.push({ group: entry, item });
  }
  return rows;
}

export const INSTITUTION_TYPE_FILTERS = [
  { value: "", label: "All Institutions" },
  { value: "Residential School", label: "Residential Schools" },
  { value: "Hostel", label: "Hostels" },
  { value: "PU College", label: "PU Colleges" },
] as const;

export const WORK_VIEW_FILTERS = [
  { value: "", label: "All Works" },
  { value: "ongoing", label: "Ongoing Works" },
  { value: "completed", label: "Completed Works" },
  { value: "tender_stage", label: "Tender Stage" },
  { value: "estimate_stage", label: "Estimate Stage" },
  { value: "site_problem", label: "Site Problem Works" },
  { value: "kkrdb", label: "KKRDB Works" },
] as const;
