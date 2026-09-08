import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import { SiteStatusBadge } from "@/components/ui/status-badge";
import { RowActions } from "@/components/ui/row-actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InstitutionFormDialog, type InstitutionPayload } from "@/components/forms/InstitutionFormDialog";
import { api } from "@/lib/adapter";
import { QK } from "@/lib/query-keys";
import { pickField } from "@/lib/display";
import type { Institution } from "@/types/institutions";
import { INSTITUTION_TYPE_FILTERS } from "@/lib/nav";
import { ActiveBadge } from "@/components/ui/status-badge";
import { useMenuAccess } from "@/lib/auth/use-access";

type InstitutionSearch = { type?: string; status?: string };

export const Route = createFileRoute("/institutions/")({
  validateSearch: (search: Record<string, unknown>): InstitutionSearch => ({
    type: typeof search.type === "string" ? search.type : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  component: InstitutionsIndexPage,
});

function InstitutionsIndexPage() {
  const { type, status } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <InstitutionsPage
      initialType={type ?? ""}
      initialSiteStatus={status ?? ""}
      onTypeChange={(value) => {
        void navigate({ search: (prev) => ({ ...prev, type: value || undefined }) });
      }}
      onSiteStatusChange={(value) => {
        void navigate({ search: (prev) => ({ ...prev, status: value || undefined }) });
      }}
    />
  );
}

type DialogMode = "create" | "edit" | "view" | null;

function toWrite(payload: InstitutionPayload): Partial<Institution> & { name: string } {
  return {
    name: payload.name,
    code: payload.code,
    is_active: payload.is_active,
    institution_type: payload.institution_type,
    category: payload.category,
    division: payload.division,
    district: payload.district,
    taluk: payload.taluk,
    constituency: payload.constituency,
    hobli: payload.hobli,
    academic_year: payload.academic_year,
    site_status: payload.site_status,
    student_capacity: payload.student_capacity,
    site_details: payload.site_details,
  };
}

export function InstitutionsPage({
  presetSiteStatus,
  presetType,
  title = "Institutions",
  initialSiteStatus,
  onSiteStatusChange,
  initialType,
  onTypeChange,
}: {
  presetSiteStatus?: string;
  presetType?: string;
  title?: string;
  initialSiteStatus?: string;
  onSiteStatusChange?: (status: string) => void;
  initialType?: string;
  onTypeChange?: (type: string) => void;
}) {
  const queryClient = useQueryClient();
  const access = useMenuAccess();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [districtFilter, setDistrictFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [siteStatusFilter, setSiteStatusFilter] = useState(initialSiteStatus ?? presetSiteStatus ?? "");
  const [typeFilter, setTypeFilter] = useState(initialType ?? presetType ?? "");
  const [isActiveFilter, setIsActiveFilter] = useState("");

  useEffect(() => {
    if (initialSiteStatus === undefined) return;
    setSiteStatusFilter(initialSiteStatus);
    setPage(1);
  }, [initialSiteStatus]);

  useEffect(() => {
    if (initialType === undefined) return;
    setTypeFilter(initialType);
    setPage(1);
  }, [initialType]);

  function changeSiteStatus(value: string) {
    setSiteStatusFilter(value);
    setPage(1);
    onSiteStatusChange?.(value);
  }

  function changeType(value: string) {
    setTypeFilter(value);
    setPage(1);
    onTypeChange?.(value);
  }
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<Institution | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Institution | null>(null);

  const ordering = sorting.length > 0 ? `${sorting[0]!.desc ? "-" : ""}${sorting[0]!.id}` : undefined;

  const params = useMemo(() => ({
    page, page_size: pageSize,
    ...(search ? { search } : {}),
    ...(ordering ? { ordering } : {}),
    ...(districtFilter ? { district: districtFilter } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(siteStatusFilter ? { site_status: siteStatusFilter } : {}),
    ...(typeFilter ? { institution_type: typeFilter } : {}),
    ...(isActiveFilter !== "" ? { is_active: isActiveFilter } : {}),
  }), [page, pageSize, search, ordering, districtFilter, categoryFilter, siteStatusFilter, typeFilter, isActiveFilter]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.institutions(params),
    queryFn: () => api.listInstitutions(params),
  });

  const { data: districts } = useQuery({
    queryKey: QK.masters("districts", { page_size: 200 }),
    queryFn: () => api.listMasters("districts", { page_size: 200 }),
  });
  const { data: categories } = useQuery({
    queryKey: QK.masters("categories", { page_size: 100 }),
    queryFn: () => api.listMasters("categories", { page_size: 100 }),
  });
  const { data: types } = useQuery({
    queryKey: QK.masters("institution-types", { page_size: 100 }),
    queryFn: () => api.listMasters("institution-types", { page_size: 100 }),
  });

  const { data: viewed, isFetching: loadingRecord } = useQuery({
    queryKey: QK.institution(selected?.id ?? 0),
    queryFn: () => api.getInstitution(selected!.id),
    enabled: (dialog === "view" || dialog === "edit") && selected != null,
  });

  const dialogRecord = dialog === "create" ? null : (viewed ?? selected);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["institutions"] });
  };

  const saveMut = useMutation({
    mutationFn: async (payload: InstitutionPayload) => {
      const body = toWrite(payload);
      if (dialog === "edit" && selected) return api.updateInstitution(selected.id, body);
      return api.createInstitution(body);
    },
    onSuccess: () => {
      toast.success(dialog === "edit" ? "Institution updated successfully." : "Institution created successfully.");
      setDialog(null);
      setSelected(null);
      void invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteInstitution(id),
    onSuccess: () => {
      toast.success("Institution deactivated successfully.");
      setPendingDelete(null);
      void invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to delete institution."),
  });

  const columns = useMemo<ColumnDef<Institution, unknown>[]>(() => [
    { accessorKey: "id", header: "ID", size: 60, enableSorting: true },
    { accessorKey: "code", header: "Code", enableSorting: true,
      cell: ({ row }) => <span className="font-mono text-[11px] text-muted-foreground">{pickField(row.original, "code")}</span> },
    { accessorKey: "name", header: "Name", enableSorting: true,
      cell: ({ getValue }) => <span className="font-medium max-w-[220px] block truncate" title={getValue() as string}>{getValue() as string}</span> },
    { id: "type", header: "Type", enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{pickField(row.original, "institution_type_name", "institution_type")}</span> },
    { id: "category", header: "Category", enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{pickField(row.original, "category_name", "category")}</span> },
    { id: "division", header: "Division", enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{pickField(row.original, "division_name", "division")}</span> },
    { id: "district", header: "District", enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{pickField(row.original, "district_name", "district")}</span> },
    { id: "taluk", header: "Taluk", enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{pickField(row.original, "taluk_name", "taluk")}</span> },
    { accessorKey: "site_status", header: "Site Status", enableSorting: true,
      cell: ({ getValue }) => <SiteStatusBadge status={getValue() as string} /> },
    { accessorKey: "student_capacity", header: "Capacity", enableSorting: true,
      cell: ({ getValue }) => <span className="numeric">{(getValue() as number)?.toLocaleString("en-IN") ?? "—"}</span> },
    {
      accessorKey: "is_active", header: "Status", enableSorting: true,
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

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
        {!presetType && (
          <select value={typeFilter} onChange={(e) => changeType(e.target.value)}
            className="border border-border rounded px-2 py-1.5 text-[12px] bg-background min-w-[180px]">
            {INSTITUTION_TYPE_FILTERS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
            ))}
            {types?.results
              .filter((t) => !INSTITUTION_TYPE_FILTERS.some((opt) => opt.value === t.name))
              .map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        )}
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
        {!presetSiteStatus && (
          <select value={siteStatusFilter} onChange={(e) => changeSiteStatus(e.target.value)}
            className="border border-border rounded px-2 py-1.5 text-[12px] bg-background">
            <option value="">All Site Status</option>
            <option value="available">Available</option>
            <option value="not_available">Not Available</option>
            <option value="problem">Problem</option>
            <option value="unknown">Unknown</option>
          </select>
        )}
        <select value={isActiveFilter} onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1); }}
          className="border border-border rounded px-2 py-1.5 text-[12px] bg-background">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {(districtFilter || categoryFilter || siteStatusFilter || typeFilter || isActiveFilter || search) && (
          <button onClick={() => {
            setDistrictFilter("");
            setCategoryFilter("");
            setTypeFilter(presetType ?? "");
            onTypeChange?.("");
            changeSiteStatus(presetSiteStatus ?? "");
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
    <AppShell title={title} breadcrumbs={[{ label: "Institutions" }]}>
      <div className="mb-4">
        <p className="text-[13px] text-muted-foreground">{data ? `${data.count.toLocaleString("en-IN")} records` : ""}</p>
      </div>
      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        error={isError ? "Failed to load institutions." : null}
        onRetry={refetch}
        pagination={{ page, pageSize, total: data?.count ?? 0 }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        sorting={sorting}
        onSortingChange={(s) => { setSorting(s); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by name or code…"
        toolbar={toolbar}
        addLabel="Add Institution"
        onAdd={access.can_create ? () => { setSelected(null); setDialog("create"); } : undefined}
        onRowClick={(row) => { setSelected(row); setDialog("view"); }}
      />

      <InstitutionFormDialog
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
        title="Deactivate institution?"
        description={pendingDelete ? `This will deactivate “${pendingDelete.name}”. It will remain in the list as inactive.` : ""}
        confirmLabel="Deactivate"
        loading={deleteMut.isPending}
        onConfirm={() => { if (pendingDelete) void deleteMut.mutateAsync(pendingDelete.id); }}
      />
    </AppShell>
  );
}
