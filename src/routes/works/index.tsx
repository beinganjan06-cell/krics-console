import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import { WorkStatusBadge } from "@/components/ui/status-badge";
import { RowActions } from "@/components/ui/row-actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { WorkFormDialog, type WorkPayload } from "@/components/forms/WorkFormDialog";
import { api } from "@/lib/adapter";
import { QK } from "@/lib/query-keys";
import { pickField } from "@/lib/display";
import type { Work } from "@/types/works";
import { WORK_VIEW_FILTERS } from "@/lib/nav";
import { ActiveBadge } from "@/components/ui/status-badge";
import { useMenuAccess } from "@/lib/auth/use-access";

type WorksSearch = { view?: string };

export const Route = createFileRoute("/works/")({
  validateSearch: (search: Record<string, unknown>): WorksSearch => ({
    view: typeof search.view === "string" ? search.view : undefined,
  }),
  component: WorksIndexPage,
});

function WorksIndexPage() {
  const { view } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <WorksPage
      view={view ?? ""}
      onViewChange={(value) => {
        void navigate({ search: { view: value || undefined } });
      }}
    />
  );
}

type DialogMode = "create" | "edit" | "view" | null;

function fmtLakh(v: number | null | undefined) {
  if (v == null) return "—";
  return `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}L`;
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function emptyToNull(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

function toWrite(payload: WorkPayload): Partial<Work> & { name: string } {
  return {
    name: payload.name,
    code: payload.code,
    work_type: payload.work_type,
    is_active: payload.is_active,
    institution: payload.institution,
    category: payload.category,
    district: payload.district,
    taluk: payload.taluk,
    constituency: payload.constituency,
    academic_year: payload.academic_year,
    scheme: payload.scheme,
    agency: payload.agency,
    status: payload.status,
    approval_reference: payload.approval_reference,
    contractor_name: payload.contractor_name,
    estimate_amount_lakh: payload.estimate_amount_lakh,
    contract_amount_lakh: payload.contract_amount_lakh,
    revised_amount_lakh: payload.revised_amount_lakh,
    financial_progress_lakh: payload.financial_progress_lakh,
    physical_progress_percent: payload.physical_progress_percent,
    work_order_date: emptyToNull(payload.work_order_date),
    site_handover_date: emptyToNull(payload.site_handover_date),
    start_date: emptyToNull(payload.start_date),
    due_date: emptyToNull(payload.due_date),
    extension_date: emptyToNull(payload.extension_date),
    completion_date: emptyToNull(payload.completion_date),
    site_details: payload.site_details,
    progress_details: payload.progress_details,
    remarks: payload.remarks,
  };
}

export function WorksPage({
  presetStatus,
  presetKkrdb,
  title = "Works",
  breadcrumb = "All Works",
  view: viewProp,
  onViewChange,
}: {
  presetStatus?: string;
  presetKkrdb?: boolean;
  title?: string;
  breadcrumb?: string;
  view?: string;
  onViewChange?: (view: string) => void;
}) {
  const queryClient = useQueryClient();
  const access = useMenuAccess();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "updated_at", desc: true }]);
  const [districtFilter, setDistrictFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [viewFilter, setViewFilter] = useState(viewProp ?? (presetKkrdb ? "kkrdb" : presetStatus ?? ""));
  const [agencyFilter, setAgencyFilter] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<Work | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Work | null>(null);

  useEffect(() => {
    if (viewProp === undefined) return;
    setViewFilter(viewProp);
    setPage(1);
  }, [viewProp]);

  function changeView(value: string) {
    setViewFilter(value);
    setPage(1);
    onViewChange?.(value);
  }

  const statusFilter = viewFilter && viewFilter !== "kkrdb" ? viewFilter : "";
  const kkrdbFilter = viewFilter === "kkrdb";

  const ordering = sorting.length > 0 ? `${sorting[0]!.desc ? "-" : ""}${sorting[0]!.id}` : undefined;

  const params = useMemo(() => ({
    page, page_size: pageSize,
    ...(search ? { search } : {}),
    ...(ordering ? { ordering } : {}),
    ...(districtFilter ? { district: districtFilter } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(agencyFilter ? { agency: agencyFilter } : {}),
    ...(schemeFilter ? { scheme: schemeFilter } : {}),
    ...(yearFilter ? { academic_year: yearFilter } : {}),
    ...(kkrdbFilter ? { kkrdb: true } : {}),
    ...(isActiveFilter !== "" ? { is_active: isActiveFilter } : {}),
  }), [page, pageSize, search, ordering, districtFilter, categoryFilter, statusFilter, agencyFilter, schemeFilter, yearFilter, kkrdbFilter, isActiveFilter]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.works(params),
    queryFn: () => api.listWorks(params),
  });

  const { data: districts } = useQuery({ queryKey: QK.masters("districts", { page_size: 200, is_active: "true" }), queryFn: () => api.listMasters("districts", { page_size: 200, is_active: "true" }) });
  const { data: categories } = useQuery({ queryKey: QK.masters("categories", { page_size: 100, is_active: "true" }), queryFn: () => api.listMasters("categories", { page_size: 100, is_active: "true" }) });
  const { data: agencies } = useQuery({ queryKey: QK.masters("agencies", { page_size: 100, is_active: "true" }), queryFn: () => api.listMasters("agencies", { page_size: 100, is_active: "true" }) });
  const { data: schemes } = useQuery({ queryKey: QK.masters("schemes", { page_size: 100, is_active: "true" }), queryFn: () => api.listMasters("schemes", { page_size: 100, is_active: "true" }) });
  const { data: years } = useQuery({ queryKey: QK.masters("academic-years", { page_size: 50, is_active: "true" }), queryFn: () => api.listMasters("academic-years", { page_size: 50, is_active: "true" }) });

  const { data: viewed, isFetching: loadingRecord } = useQuery({
    queryKey: QK.work(selected?.id ?? 0),
    queryFn: () => api.getWork(selected!.id),
    enabled: (dialog === "view" || dialog === "edit") && selected != null,
  });
  const dialogRecord = dialog === "create" ? null : (viewed ?? selected);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["works"] });

  const saveMut = useMutation({
    mutationFn: async (payload: WorkPayload) => {
      const body = toWrite(payload);
      if (dialog === "edit" && selected) return api.updateWork(selected.id, body);
      return api.createWork(body);
    },
    onSuccess: () => {
      toast.success(dialog === "edit" ? "Work updated successfully." : "Work created successfully.");
      setDialog(null);
      setSelected(null);
      void invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteWork(id),
    onSuccess: () => {
      toast.success("Work deactivated successfully.");
      setPendingDelete(null);
      void invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete work."),
  });

  const columns = useMemo<ColumnDef<Work, unknown>[]>(() => [
    { accessorKey: "code", header: "Code", enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-[11px] text-muted-foreground">{pickField(row.original, "code")}</span> },
    { accessorKey: "name", header: "Work Name", enableSorting: true,
      cell: ({ getValue }) => <span className="font-medium max-w-[200px] block truncate" title={getValue() as string}>{getValue() as string}</span> },
    { id: "district", header: "District", enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{pickField(row.original, "district_name", "district")}</span> },
    { id: "category", header: "Category", enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{pickField(row.original, "category_name", "category")}</span> },
    { id: "status", header: "Status", enableSorting: false,
      cell: ({ row }) => <WorkStatusBadge status={pickField(row.original, "status_name", "status")} /> },
    { id: "estimate", header: "Estimate (L)", enableSorting: true,
      cell: ({ row }) => {
        const rec = row.original as Work & { estimate_amount?: number };
        return <span className="numeric text-right block">{fmtLakh(rec.estimate_amount_lakh ?? rec.estimate_amount)}</span>;
      } },
    { accessorKey: "financial_progress_lakh", header: "Financial (L)", enableSorting: true,
      cell: ({ row }) => {
        const rec = row.original as Work & { financial_progress?: number };
        return <span className="numeric text-right block">{fmtLakh(rec.financial_progress_lakh ?? rec.financial_progress)}</span>;
      } },
    { id: "physical", header: "Physical %", enableSorting: true,
      cell: ({ row }) => {
        const rec = row.original as Work & { physical_progress?: number };
        const pct = Number(rec.physical_progress_percent ?? rec.physical_progress ?? 0);
        return (
          <div className="flex items-center gap-1.5 min-w-[80px]">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="numeric text-[11px] w-8 text-right">{pct}%</span>
          </div>
        );
      } },
    { accessorKey: "due_date", header: "Due Date", enableSorting: true,
      cell: ({ getValue }) => <span className="text-muted-foreground">{fmtDate(getValue() as string)}</span> },
    { accessorKey: "updated_at", header: "Updated", enableSorting: true,
      cell: ({ getValue }) => <span className="text-muted-foreground">{fmtDate(getValue() as string)}</span> },
    {
      accessorKey: "is_active", header: "Active", enableSorting: true,
      cell: ({ getValue }) => <ActiveBadge active={getValue() as boolean} />,
    },
    {
      id: "actions", header: "Actions", enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          onView={() => { setSelected(row.original); setDialog("view"); }}
          onEdit={access.can_edit ? () => { setSelected(row.original); setDialog("edit"); } : undefined}
          onDelete={access.can_delete ? () => setPendingDelete(row.original) : undefined}
        />
      ),
    },
  ], [access.can_edit, access.can_delete]);

  const hasFilters = !!(districtFilter || categoryFilter || viewFilter || agencyFilter || schemeFilter || yearFilter || isActiveFilter || search);

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <select value={viewFilter} onChange={(e) => changeView(e.target.value)}
        className="border border-border rounded px-2 py-1.5 text-[12px] bg-background min-w-[200px] font-medium">
        {WORK_VIEW_FILTERS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <select value={districtFilter} onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
        className="border border-border rounded px-2 py-1.5 text-[12px] bg-background">
        <option value="">All Districts</option>
        {districts?.results.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
      </select>
      <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
        className="border border-border rounded px-2 py-1.5 text-[12px] bg-background">
        <option value="">All Categories</option>
        {categories?.results.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
      <select value={agencyFilter} onChange={(e) => { setAgencyFilter(e.target.value); setPage(1); }}
        className="border border-border rounded px-2 py-1.5 text-[12px] bg-background">
        <option value="">All Agencies</option>
        {agencies?.results.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
      </select>
      <select value={schemeFilter} onChange={(e) => { setSchemeFilter(e.target.value); setPage(1); }}
        className="border border-border rounded px-2 py-1.5 text-[12px] bg-background">
        <option value="">All Schemes</option>
        {schemes?.results.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
      </select>
      <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
        className="border border-border rounded px-2 py-1.5 text-[12px] bg-background">
        <option value="">All Years</option>
        {years?.results.map((y) => <option key={y.id} value={y.name}>{y.name}</option>)}
      </select>
      <select value={isActiveFilter} onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1); }}
        className="border border-border rounded px-2 py-1.5 text-[12px] bg-background">
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
      {hasFilters && (
        <button onClick={() => {
          setDistrictFilter("");
          setCategoryFilter("");
          changeView("");
          setAgencyFilter("");
          setSchemeFilter("");
          setYearFilter("");
          setIsActiveFilter("");
          setPage(1);
        }}
          className="text-[12px] text-muted-foreground hover:text-foreground underline">
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <AppShell title={title} breadcrumbs={[{ label: "Works Management" }, { label: breadcrumb }]}>
      <div className="mb-4">
        <p className="text-[13px] text-muted-foreground">{data ? `${data.count.toLocaleString("en-IN")} records` : ""}</p>
      </div>
      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        error={isError ? "Failed to load works." : null}
        onRetry={refetch}
        pagination={{ page, pageSize, total: data?.count ?? 0 }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        sorting={sorting}
        onSortingChange={(s) => { setSorting(s); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name, code, contractor…"
        toolbar={toolbar}
        addLabel="Add Work"
        onAdd={access.can_create ? () => { setSelected(null); setDialog("create"); } : undefined}
        onRowClick={(row) => { setSelected(row); setDialog("view"); }}
      />

      <WorkFormDialog
        open={dialog !== null}
        mode={dialog ?? "view"}
        record={dialogRecord}
        loadingRecord={Boolean(dialog && dialog !== "create" && selected && loadingRecord && !viewed)}
        saving={saveMut.isPending}
        onOpenChange={(open) => { if (!open) { setDialog(null); setSelected(null); } }}
        onSubmit={(payload) => saveMut.mutateAsync(payload)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Deactivate work?"
        description={pendingDelete ? `This will deactivate “${pendingDelete.name}”. It will remain in the list as inactive.` : ""}
        confirmLabel="Deactivate"
        loading={deleteMut.isPending}
        onConfirm={() => { if (pendingDelete) void deleteMut.mutateAsync(pendingDelete.id); }}
      />
    </AppShell>
  );
}
