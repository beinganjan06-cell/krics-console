import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import { api } from "@/lib/adapter";
import { QK } from "@/lib/query-keys";
import type { ImportedRow } from "@/types/imports";

export const Route = createFileRoute("/imports/audit")({
  component: AuditPage,
});

function AuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");

  const params = useMemo(() => ({
    page, page_size: pageSize,
    ...(search ? { search } : {}),
    ...(entityType ? { entity_type: entityType } : {}),
  }), [page, pageSize, search, entityType]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.audit(params),
    queryFn: () => api.listAuditRows(params),
  });

  const columns = useMemo<ColumnDef<ImportedRow, unknown>[]>(() => [
    {
      id: "batch", header: "Batch", enableSorting: false,
      cell: ({ row }) => <span className="font-mono text-[11px]">{row.original.batch_ref ?? `#${row.original.batch}`}</span>,
    },
    { accessorKey: "source_file", header: "File", enableSorting: false,
      cell: ({ getValue }) => <span className="text-muted-foreground text-[11px] max-w-[140px] block truncate" title={getValue() as string}>{getValue() as string}</span> },
    {
      id: "sheet", header: "Sheet", enableSorting: false,
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.source_sheet ?? row.original.sheet ?? "—"}</span>,
    },
    {
      id: "row_num", header: "Row #", enableSorting: false,
      cell: ({ row }) => <span className="numeric">{row.original.source_row ?? row.original.row_number ?? "—"}</span>,
    },
    { accessorKey: "entity_type", header: "Entity", enableSorting: false,
      cell: ({ getValue }) => {
        const v = getValue() as string;
        const cls = v === "institution" ? "bg-info-soft text-info" : v === "work" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground";
        return <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${cls}`}>{v}</span>;
      } },
    {
      id: "imported_at", header: "Imported", enableSorting: false,
      cell: ({ row }) => {
        const v = row.original.imported_at ?? row.original.created_at;
        if (!v) return <span className="text-muted-foreground">—</span>;
        return <span className="text-muted-foreground">{new Date(v).toLocaleDateString("en-IN")}</span>;
      },
    },
    {
      id: "raw", header: "Raw Data", enableSorting: false,
      cell: ({ row }) => {
        const json = row.original.row_data ?? row.original.raw_json ?? {};
        return (
          <details className="cursor-pointer">
            <summary className="text-[11px] text-primary hover:underline list-none">View JSON</summary>
            <pre className="mt-1 text-[10px] bg-muted p-2 rounded max-w-[300px] overflow-auto max-h-32 whitespace-pre-wrap">
              {JSON.stringify(json, null, 2)}
            </pre>
          </details>
        );
      },
    },
  ], []);

  const toolbar = (
    <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
      className="border border-border rounded px-2 py-1.5 text-[12px] bg-background">
      <option value="">All Entity Types</option>
      <option value="institution">Institution</option>
      <option value="work">Work</option>
      <option value="raw">Raw</option>
    </select>
  );

  return (
    <AppShell title="Source Row Audit" breadcrumbs={[{ label: "Data Import" }, { label: "Source Row Audit" }]}>
      <div className="mb-4">
        <p className="text-[13px] text-muted-foreground">{data ? `${data.count.toLocaleString("en-IN")} rows` : ""}</p>
      </div>
      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        error={isError ? "Failed to load audit rows." : null}
        onRetry={refetch}
        pagination={{ page, pageSize, total: data?.count ?? 0 }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by file, sheet…"
        toolbar={toolbar}
      />
    </AppShell>
  );
}
