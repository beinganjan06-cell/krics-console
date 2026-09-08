import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import { ActiveBadge } from "@/components/ui/status-badge";
import { RowActions } from "@/components/ui/row-actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MasterFormDialog } from "@/components/forms/MasterFormDialog";
import { api } from "@/lib/adapter";
import { QK } from "@/lib/query-keys";
import { ApiError } from "@/types/api";
import type { MasterPayload, MasterRecord, MasterResource } from "@/types/masters";
import { getMasterConfig } from "@/types/masters";
import { useMenuAccess } from "@/lib/auth/use-access";

export const Route = createFileRoute("/masters/$resource")({
  component: MasterPage,
});

const RESOURCE_LABELS: Record<string, string> = {
  divisions: "Divisions",
  districts: "Districts",
  taluks: "Taluks",
  constituencies: "Constituencies",
  hoblis: "Hoblis",
  categories: "Caste Categories",
  "caste-categories": "Caste Categories",
  "institution-types": "Institution Types",
  agencies: "Agencies",
  schemes: "Schemes",
  "academic-years": "Academic Years",
  "work-statuses": "Work Statuses",
};

type DialogMode = "create" | "edit" | "view" | null;

function MasterPage() {
  const { resource } = useParams({ from: "/masters/$resource" });
  const label = RESOURCE_LABELS[resource] ?? resource;
  const config = getMasterConfig(resource as MasterResource);
  const queryClient = useQueryClient();
  const access = useMenuAccess();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [divisionFilter, setDivisionFilter] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<MasterRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MasterRecord | null>(null);

  const ordering = sorting.length > 0 ? `${sorting[0]!.desc ? "-" : ""}${sorting[0]!.id}` : undefined;

  const params = useMemo(() => ({
    page, page_size: pageSize,
    ...(search ? { search } : {}),
    ...(isActive !== "" ? { is_active: isActive } : {}),
    ...(districtFilter ? { district: districtFilter } : {}),
    ...(divisionFilter ? { division: divisionFilter } : {}),
    ...(ordering ? { ordering } : {}),
  }), [page, pageSize, search, isActive, districtFilter, divisionFilter, ordering]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.masters(resource, params),
    queryFn: () => api.listMasters(resource as MasterResource, params),
  });

  const { data: viewed } = useQuery({
    queryKey: QK.master(resource, selected?.id ?? 0),
    queryFn: () => api.getMaster(resource as MasterResource, selected!.id),
    enabled: dialog === "view" && selected != null,
  });

  const { data: districtData } = useQuery({
    queryKey: QK.masters("districts", { page_size: 200 }),
    queryFn: () => api.listMasters("districts", { page_size: 200 }),
    enabled: ["taluks", "constituencies", "hoblis"].includes(resource),
  });
  const { data: divisionData } = useQuery({
    queryKey: QK.masters("divisions", { page_size: 50, is_active: "true" }),
    queryFn: () => api.listMasters("divisions", { page_size: 50, is_active: "true" }),
    enabled: resource === "districts",
  });

  const showDistrictFilter = ["taluks", "constituencies"].includes(resource);
  const showDistrictCol = ["taluks", "constituencies"].includes(resource);
  const showDivisionFilter = resource === "districts";

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["masters", resource] });

  const saveMut = useMutation({
    mutationFn: async (payload: MasterPayload) => {
      if (dialog === "edit" && selected) {
        return api.updateMaster(resource as MasterResource, selected.id, payload);
      }
      return api.createMaster(resource as MasterResource, payload);
    },
    onSuccess: () => {
      toast.success(dialog === "edit" ? `${config.singular} updated successfully.` : `${config.singular} created successfully.`);
      setDialog(null);
      setSelected(null);
      void invalidate();
    },
    onError: (error) => {
      if (!(error instanceof ApiError && Object.keys(error.fieldErrors).length)) {
        toast.error(error instanceof Error ? error.message : "Unable to save record.");
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteMaster(resource as MasterResource, id),
    onSuccess: () => {
      toast.success(`${config.singular} deactivated successfully.`);
      setPendingDelete(null);
      void invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete record.");
    },
  });

  const columns = useMemo<ColumnDef<MasterRecord, unknown>[]>(() => [
    { accessorKey: "id", header: "ID", size: 60, enableSorting: true },
    { accessorKey: "name", header: "Name", enableSorting: true,
      cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span> },
    { accessorKey: "code", header: "Code", enableSorting: true,
      cell: ({ getValue }) => <span className="text-muted-foreground font-mono text-[11px]">{(getValue() as string) || "—"}</span> },
    ...(showDivisionFilter ? [{
      accessorKey: "division_name" as keyof MasterRecord,
      header: "Division",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => <span className="text-muted-foreground">{(getValue() as string) || "—"}</span>,
    } as ColumnDef<MasterRecord, unknown>] : []),
    ...(showDistrictCol ? [{
      accessorKey: "district_name" as keyof MasterRecord,
      header: "District",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => <span className="text-muted-foreground">{(getValue() as string) || "—"}</span>,
    } as ColumnDef<MasterRecord, unknown>] : []),
    ...(resource === "hoblis" ? [{
      accessorKey: "taluk_name" as keyof MasterRecord,
      header: "Taluk",
      enableSorting: false,
      cell: ({ getValue }: { getValue: () => unknown }) => <span className="text-muted-foreground">{(getValue() as string) || "—"}</span>,
    } as ColumnDef<MasterRecord, unknown>] : []),
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
  ], [resource, showDistrictCol, showDivisionFilter, access.can_edit, access.can_delete]);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleIsActive(v: string) { setIsActive(v); setPage(1); }
  function handleDistrict(v: string) { setDistrictFilter(v); setPage(1); }
  function handleDivision(v: string) { setDivisionFilter(v); setPage(1); }
  function handleSorting(s: SortingState) { setSorting(s); setPage(1); }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={isActive}
        onChange={(e) => handleIsActive(e.target.value)}
        className="border border-border rounded px-2 py-1.5 text-[12px] bg-background"
      >
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
      {showDivisionFilter && (
        <select
          value={divisionFilter}
          onChange={(e) => handleDivision(e.target.value)}
          className="border border-border rounded px-2 py-1.5 text-[12px] bg-background"
        >
          <option value="">All Divisions</option>
          {divisionData?.results.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      )}
      {showDistrictFilter && (
        <select
          value={districtFilter}
          onChange={(e) => handleDistrict(e.target.value)}
          className="border border-border rounded px-2 py-1.5 text-[12px] bg-background"
        >
          <option value="">All Districts</option>
          {districtData?.results.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <AppShell
      title={label}
      breadcrumbs={[{ label: "Master Management" }, { label }]}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-muted-foreground">
          {data ? `${data.count.toLocaleString("en-IN")} records` : ""}
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        error={isError ? "Failed to load data." : null}
        onRetry={refetch}
        pagination={{ page, pageSize, total: data?.count ?? 0 }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        sorting={sorting}
        onSortingChange={handleSorting}
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder={`Search ${label.toLowerCase()}…`}
        toolbar={toolbar}
        addLabel={`Add ${config.singular}`}
        onAdd={access.can_create ? () => { setSelected(null); setDialog("create"); } : undefined}
      />

      <MasterFormDialog
        open={dialog !== null}
        mode={dialog ?? "view"}
        resource={resource as MasterResource}
        record={dialog === "view" ? (viewed ?? selected) : selected}
        saving={saveMut.isPending}
        onOpenChange={(open) => { if (!open) { setDialog(null); setSelected(null); } }}
        onSubmit={(payload) => saveMut.mutateAsync(payload)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title={`Deactivate ${config.singular}?`}
        description={pendingDelete
          ? `This will deactivate “${pendingDelete.name}”. It will remain in the list as inactive and can be restored later.`
          : ""}
        confirmLabel="Deactivate"
        loading={deleteMut.isPending}
        onConfirm={() => { if (pendingDelete) void deleteMut.mutateAsync(pendingDelete.id); }}
      />
    </AppShell>
  );
}
