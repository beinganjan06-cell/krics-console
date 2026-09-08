import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/adapter";
import { QK } from "@/lib/query-keys";
import { INSTITUTION_TYPE_FILTERS, WORK_VIEW_FILTERS } from "@/lib/nav";
import { SITE_STATUS_LABEL } from "@/types/institutions";
import { WORK_STATUS_LABEL, type WorkStatusKey } from "@/types/works";
import { REPORT_SLUGS, type ReportColumn, type ReportSlug } from "@/types/reports";
import { cn } from "@/lib/utils";

const SELECT_CLASS = "border border-border rounded px-2 py-1.5 text-[12px] bg-background min-w-[140px]";
const INPUT_CLASS = "border border-border rounded px-2 py-1.5 text-[12px] bg-background";
const FIELD_SELECT = cn(SELECT_CLASS, "w-full min-w-0");
const FIELD_INPUT = cn(INPUT_CLASS, "w-full min-w-0");

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const TYPE_LABEL: Record<string, string> = {
  school: "Schools",
  hostel: "Hostels",
  pu_college: "PU Colleges",
  other: "Other",
};

function isReportSlug(value: string): value is ReportSlug {
  return (REPORT_SLUGS as string[]).includes(value);
}

const REPORT_DEFAULT_GROUP: Record<ReportSlug, string> = {
  "works-summary": "detail",
  "district-summary": "district",
  "category-summary": "category",
  "financial-progress": "detail",
  "physical-progress": "detail",
  "institution-coverage": "detail",
};

function defaultGroupFor(slug: string) {
  return isReportSlug(slug) ? REPORT_DEFAULT_GROUP[slug] : "detail";
}

function formatCell(column: ReportColumn, value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  if (column.type === "percent") {
    return `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
  }
  if (column.type === "date") {
    return String(value);
  }
  if (column.type === "number") {
    const n = Number(value);
    const money = column.key.includes("lakh") || column.key.includes("pct");
    return n.toLocaleString("en-IN", {
      maximumFractionDigits: money || !Number.isInteger(n) ? 2 : 0,
    });
  }
  return String(value);
}

function formatGeneratedAt(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ReportPage({ slug }: { slug: string }) {
  const valid = isReportSlug(slug);
  const isCoverage = slug === "institution-coverage";
  const showWorkFilters = !isCoverage;
  const showInstFilters = isCoverage || slug === "district-summary" || slug === "category-summary";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [taluk, setTaluk] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [scheme, setScheme] = useState("");
  const [agency, setAgency] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [siteStatus, setSiteStatus] = useState("");
  const [groupBy, setGroupBy] = useState(() => defaultGroupFor(slug));
  const [fieldKeys, setFieldKeys] = useState<string[] | null>(null);
  const [showFields, setShowFields] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    setPage(1);
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setDivision("");
    setDistrict("");
    setTaluk("");
    setCategory("");
    setYear("");
    setStatus("");
    setScheme("");
    setAgency("");
    setInstitutionType("");
    setSiteStatus("");
    setGroupBy(defaultGroupFor(slug));
    setFieldKeys(null);
    setShowFields(false);
    setExportOpen(false);
  }, [slug]);

  const masterParams = { page_size: 300, is_active: "true" as const };
  const { data: divisions } = useQuery({
    queryKey: QK.masters("divisions", masterParams),
    queryFn: () => api.listMasters("divisions", masterParams),
  });
  const { data: districts } = useQuery({
    queryKey: QK.masters("districts", { ...masterParams, division }),
    queryFn: () => api.listMasters("districts", { ...masterParams, ...(division ? { division } : {}) }),
  });
  const { data: taluks } = useQuery({
    queryKey: QK.masters("taluks", masterParams),
    queryFn: () => api.listMasters("taluks", masterParams),
  });
  const { data: categories } = useQuery({
    queryKey: QK.masters("categories", masterParams),
    queryFn: () => api.listMasters("categories", masterParams),
  });
  const { data: years } = useQuery({
    queryKey: QK.masters("academic-years", masterParams),
    queryFn: () => api.listMasters("academic-years", masterParams),
  });
  const { data: agencies } = useQuery({
    queryKey: QK.masters("agencies", masterParams),
    queryFn: () => api.listMasters("agencies", masterParams),
    enabled: showWorkFilters,
  });
  const { data: schemes } = useQuery({
    queryKey: QK.masters("schemes", masterParams),
    queryFn: () => api.listMasters("schemes", masterParams),
    enabled: showWorkFilters,
  });
  const { data: types } = useQuery({
    queryKey: QK.masters("institution-types", masterParams),
    queryFn: () => api.listMasters("institution-types", masterParams),
    enabled: showInstFilters,
  });

  const districtTaluks = useMemo(() => {
    const rows = taluks?.results ?? [];
    if (!district) return rows;
    return rows.filter(
      (row) => row.district_name === district || String(row.district ?? "") === district,
    );
  }, [taluks, district]);

  const kkrdb = status === "kkrdb";
  const statusValue = status && status !== "kkrdb" ? status : "";

  const params = useMemo(() => {
    const available = fieldKeys;
    return {
      ...(search ? { search } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
      ...(division ? { division } : {}),
      ...(district ? { district } : {}),
      ...(taluk ? { taluk } : {}),
      ...(category ? { category } : {}),
      ...(year ? { academic_year: year } : {}),
      ...(statusValue ? { status: statusValue } : {}),
      ...(kkrdb ? { kkrdb: true } : {}),
      ...(scheme ? { scheme } : {}),
      ...(agency ? { agency } : {}),
      ...(institutionType ? { institution_type: institutionType } : {}),
      ...(siteStatus ? { site_status: siteStatus } : {}),
      ...(groupBy ? { group_by: groupBy } : { group_by: defaultGroupFor(slug) }),
      ...(available?.length ? { fields: available.join(",") } : {}),
    };
  }, [
    slug, search, dateFrom, dateTo, division, district, taluk, category, year,
    statusValue, kkrdb, scheme, agency, institutionType, siteStatus, groupBy, fieldKeys,
  ]);

  const listParams = useMemo(() => ({
    ...params,
    page,
    page_size: pageSize,
  }), [params, page, pageSize]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.report(slug, listParams),
    queryFn: () => api.getReport(slug, listParams),
    enabled: valid,
  });

  const exportMut = useMutation({
    mutationFn: (format: "excel" | "word") => api.exportReport(slug, format, params),
    onSuccess: (_void, format) => toast.success(format === "excel" ? "Excel download started." : "Word download started."),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Export failed."),
  });

  const columns = useMemo(() => {
    return (data?.columns ?? []).map((col) => ({
      id: col.key,
      accessorKey: col.key,
      header: () => (
        <span className="inline-flex flex-col leading-tight text-left">
          {col.label_kn ? <span className="text-[10px] font-normal text-primary-foreground/85">{col.label_kn}</span> : null}
          <span>{col.label}</span>
        </span>
      ),
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const formatted = formatCell(col, getValue() as string | number | null);
        return (
          <span
            className={cn(
              col.type !== "text" && col.type !== "date" && "numeric text-right block",
              (col.key === "name" || col.key === "group") && "font-medium",
              col.key === "name" && "max-w-[280px] block truncate",
            )}
            title={formatted}
          >
            {formatted}
          </span>
        );
      },
    }));
  }, [data?.columns]);

  const pagedRows = data?.rows ?? [];

  const hasFilters = Boolean(
    search || dateFrom || dateTo || division || district || taluk || category || year
    || status || scheme || agency || institutionType || siteStatus || fieldKeys
    || (groupBy && groupBy !== defaultGroupFor(slug)),
  );

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setDivision("");
    setDistrict("");
    setTaluk("");
    setCategory("");
    setYear("");
    setStatus("");
    setScheme("");
    setAgency("");
    setInstitutionType("");
    setSiteStatus("");
    setGroupBy(defaultGroupFor(slug));
    setFieldKeys(null);
    setPage(1);
  }

  function toggleField(key: string) {
    const available = (data?.available_fields ?? []).map((f) => f.key);
    const visible = (data?.columns ?? []).map((f) => f.key).filter((k) => k !== "sl_no");
    const current = fieldKeys ?? (visible.length ? visible : available);
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    setFieldKeys(next.length ? next : available);
    setPage(1);
  }

  const selectedFieldSet = new Set(
    fieldKeys
    ?? (data?.columns ?? []).map((f) => f.key).filter((k) => k !== "sl_no")
    ?? data?.available_fields.map((f) => f.key)
    ?? [],
  );

  if (!valid) {
    return (
      <AppShell title="Reports" breadcrumbs={[{ label: "Reports" }]}>
        <p className="text-[13px] text-muted-foreground">Unknown report. Choose a report from the Reports menu.</p>
      </AppShell>
    );
  }

  const title = data?.title ?? slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const groupOptions = data?.group_by_options ?? [];
  const groupValue = groupBy || data?.group_by || "";

  const filterFields = (
    <>
      <FilterField label="Search">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Name, code, contractor, district…"
          className={FIELD_INPUT}
        />
      </FilterField>
      <FilterField label="Group by">
        <select value={groupValue} onChange={(e) => { setGroupBy(e.target.value); setFieldKeys(null); setPage(1); }} className={FIELD_SELECT}>
          {groupOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}{opt.label_kn ? ` / ${opt.label_kn}` : ""}</option>
          ))}
        </select>
      </FilterField>
      <FilterField label="Division">
        <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(""); setTaluk(""); setPage(1); }} className={FIELD_SELECT}>
          <option value="">All Divisions</option>
          {divisions?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
        </select>
      </FilterField>
      <FilterField label="District">
        <select value={district} onChange={(e) => { setDistrict(e.target.value); setTaluk(""); setPage(1); }} className={FIELD_SELECT}>
          <option value="">All Districts</option>
          {districts?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
        </select>
      </FilterField>
      <FilterField label="Taluk">
        <select value={taluk} onChange={(e) => { setTaluk(e.target.value); setPage(1); }} className={FIELD_SELECT}>
          <option value="">All Taluks</option>
          {districtTaluks.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
        </select>
      </FilterField>
      <FilterField label="Category">
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={FIELD_SELECT}>
          <option value="">All Categories</option>
          {categories?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
        </select>
      </FilterField>
      <FilterField label="Academic year">
        <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} className={FIELD_SELECT}>
          <option value="">All Years</option>
          {years?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
        </select>
      </FilterField>
      {showWorkFilters && (
        <>
          <FilterField label="Work status">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={FIELD_SELECT}>
              {WORK_VIEW_FILTERS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Agency">
            <select value={agency} onChange={(e) => { setAgency(e.target.value); setPage(1); }} className={FIELD_SELECT}>
              <option value="">All Agencies</option>
              {agencies?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
            </select>
          </FilterField>
          <FilterField label="Scheme">
            <select value={scheme} onChange={(e) => { setScheme(e.target.value); setPage(1); }} className={FIELD_SELECT}>
              <option value="">All Schemes</option>
              {schemes?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
            </select>
          </FilterField>
          <FilterField label="From date">
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={FIELD_INPUT} />
          </FilterField>
          <FilterField label="To date">
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={FIELD_INPUT} />
          </FilterField>
        </>
      )}
      {showInstFilters && (
        <>
          <FilterField label="Institution type">
            <select value={institutionType} onChange={(e) => { setInstitutionType(e.target.value); setPage(1); }} className={FIELD_SELECT}>
              {INSTITUTION_TYPE_FILTERS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
              ))}
              {types?.results
                .filter((row) => !INSTITUTION_TYPE_FILTERS.some((opt) => opt.value === row.name))
                .map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
            </select>
          </FilterField>
          <FilterField label="Site status">
            <select value={siteStatus} onChange={(e) => { setSiteStatus(e.target.value); setPage(1); }} className={FIELD_SELECT}>
              <option value="">All Sites</option>
              {Object.entries(SITE_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </FilterField>
        </>
      )}
    </>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={groupValue}
        onChange={(e) => { setGroupBy(e.target.value); setFieldKeys(null); setPage(1); }}
        className={cn(SELECT_CLASS, "font-medium")}
      >
        {groupOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <Button size="sm" className="h-8" onClick={() => setExportOpen(true)}>
        <Download size={14} />
        Export
      </Button>
    </div>
  );

  return (
    <AppShell title={title} breadcrumbs={[{ label: "Reports" }, { label: title }]}>
      <div className="mb-4 space-y-1">
        {data?.title_kn && <p className="text-[15px] font-semibold text-primary">{data.title_kn}</p>}
        <p className="text-[12px] text-muted-foreground">
          {data?.subtitle_kn ? `${data.subtitle_kn} · ` : ""}
          {data?.subtitle ?? "Karnataka Residential Educational Institutions Society (KRICS)"}
          {data?.generated_at ? ` · Generated ${formatGeneratedAt(data.generated_at)}` : ""}
          {groupValue === "detail"
            ? " · Excel-style detailed list (one row per record)"
            : " · Abstract / count report (grouped totals)"}
        </p>
        {data?.filters_applied?.length ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {data.filters_applied.map((item) => (
              <span key={`${item.label}-${item.value}`} className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {data?.by_status?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          {data.by_status.map((row) => (
            <div key={row.status} className="border border-border rounded-lg px-3 py-2 bg-card">
              <p className="text-[11px] text-muted-foreground">{row.label ?? WORK_STATUS_LABEL[row.status as WorkStatusKey] ?? row.status}</p>
              <p className="text-lg font-semibold numeric">{row.count}</p>
            </div>
          ))}
        </div>
      ) : null}

      {data?.buckets?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {data.buckets.map((row) => (
            <div key={row.bucket} className="border border-border rounded-lg px-3 py-2 bg-card">
              <p className="text-[11px] text-muted-foreground">{row.bucket}</p>
              <p className="text-lg font-semibold numeric">{row.count}</p>
            </div>
          ))}
        </div>
      ) : null}

      {data?.by_type?.length || data?.site ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
          {data.by_type?.map((row) => (
            <div key={row.type} className="border border-border rounded-lg px-3 py-2 bg-card">
              <p className="text-[11px] text-muted-foreground">{TYPE_LABEL[row.type] ?? row.type}</p>
              <p className="text-lg font-semibold numeric">{row.count}</p>
            </div>
          ))}
          {data.site ? (
            <>
              <div className="border border-border rounded-lg px-3 py-2 bg-card">
                <p className="text-[11px] text-muted-foreground">Site available</p>
                <p className="text-lg font-semibold numeric">{data.site.available}</p>
              </div>
              <div className="border border-border rounded-lg px-3 py-2 bg-card">
                <p className="text-[11px] text-muted-foreground">Not available</p>
                <p className="text-lg font-semibold numeric">{data.site.not_available}</p>
              </div>
              <div className="border border-border rounded-lg px-3 py-2 bg-card">
                <p className="text-[11px] text-muted-foreground">Site problem</p>
                <p className="text-lg font-semibold numeric">{data.site.problem}</p>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="border border-border rounded-lg p-3 mb-3 bg-card space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(""); setTaluk(""); setPage(1); }} className={SELECT_CLASS}>
            <option value="">All Divisions</option>
            {divisions?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
          </select>
          <select value={district} onChange={(e) => { setDistrict(e.target.value); setTaluk(""); setPage(1); }} className={SELECT_CLASS}>
            <option value="">All Districts</option>
            {districts?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
          </select>
          <select value={taluk} onChange={(e) => { setTaluk(e.target.value); setPage(1); }} className={SELECT_CLASS}>
            <option value="">All Taluks</option>
            {districtTaluks.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
          </select>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={SELECT_CLASS}>
            <option value="">All Categories</option>
            {categories?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
          </select>
          <select value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} className={SELECT_CLASS}>
            <option value="">All Years</option>
            {years?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
          </select>
          {showWorkFilters && (
            <>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={SELECT_CLASS}>
                {WORK_VIEW_FILTERS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select value={agency} onChange={(e) => { setAgency(e.target.value); setPage(1); }} className={SELECT_CLASS}>
                <option value="">All Agencies</option>
                {agencies?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
              </select>
              <select value={scheme} onChange={(e) => { setScheme(e.target.value); setPage(1); }} className={SELECT_CLASS}>
                <option value="">All Schemes</option>
                {schemes?.results.map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
              </select>
            </>
          )}
          {showInstFilters && (
            <>
              <select value={institutionType} onChange={(e) => { setInstitutionType(e.target.value); setPage(1); }} className={SELECT_CLASS}>
                {INSTITUTION_TYPE_FILTERS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
                ))}
                {types?.results
                  .filter((row) => !INSTITUTION_TYPE_FILTERS.some((opt) => opt.value === row.name))
                  .map((row) => <option key={row.id} value={row.name}>{row.name}</option>)}
              </select>
              <select value={siteStatus} onChange={(e) => { setSiteStatus(e.target.value); setPage(1); }} className={SELECT_CLASS}>
                <option value="">All Sites</option>
                {Object.entries(SITE_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </>
          )}
          {showWorkFilters && (
            <>
              <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                From
                <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={INPUT_CLASS} />
              </label>
              <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                To
                <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={INPUT_CLASS} />
              </label>
            </>
          )}
          {hasFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground underline">
              <RotateCcw size={11} /> Clear filters
            </button>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => setShowFields((v) => !v)}
            className="text-[12px] font-medium text-primary hover:underline"
          >
            {showFields ? "Hide fields" : "Choose fields for table & export"}
          </button>
          {showFields && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {(data?.available_fields ?? []).map((field) => (
                <label key={field.key} className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3 h-3"
                    checked={selectedFieldSet.has(field.key)}
                    onChange={() => toggleField(field.key)}
                  />
                  <span>{field.label}</span>
                  {field.label_kn ? <span className="text-muted-foreground">({field.label_kn})</span> : null}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <DataTable
        columns={columns as never}
        data={pagedRows}
        loading={isLoading}
        error={isError ? "Failed to load report." : null}
        onRetry={() => void refetch()}
        pagination={{ page, pageSize, total: data?.row_count ?? 0 }}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search name, code, contractor, district…"
        toolbar={toolbar}
      />

      {data && data.row_count > 0 && (
        <div className="mt-2 border border-border rounded-lg bg-[#E8F3F2] px-3 py-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
          <span className="font-semibold">ಒಟ್ಟು / TOTAL</span>
          {(data.columns ?? [])
            .filter((col) => (col.type === "number" || col.type === "percent") && col.key !== "sl_no" && data.totals[col.key] != null)
            .map((col) => (
              <span key={col.key}>
                <span className="text-muted-foreground">{col.label}: </span>
                <span className="font-semibold numeric">{formatCell(col, data.totals[col.key])}</span>
              </span>
            ))}
        </div>
      )}

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export {title}</DialogTitle>
            <DialogDescription>
              Set filters and fields, then download Excel or Word. Detail reports match the KRICS work/school Excel register. Abstract reports export counts like the Excel abstracts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filterFields}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-medium">Fields in Excel / Word</p>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground underline">
                  <RotateCcw size={11} /> Clear filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 border border-border rounded-md p-2.5 max-h-40 overflow-y-auto">
              {(data?.available_fields ?? []).map((field) => (
                <label key={field.key} className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3 h-3"
                    checked={selectedFieldSet.has(field.key)}
                    onChange={() => toggleField(field.key)}
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-row flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              disabled={exportMut.isPending}
              onClick={() => exportMut.mutate("excel")}
            >
              <FileSpreadsheet size={16} />
              {exportMut.isPending && exportMut.variables === "excel" ? "Exporting…" : "Export to Excel"}
            </Button>
            <Button
              disabled={exportMut.isPending}
              onClick={() => exportMut.mutate("word")}
            >
              <FileText size={16} />
              {exportMut.isPending && exportMut.variables === "word" ? "Exporting…" : "Export to Word"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
