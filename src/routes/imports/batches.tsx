import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import { api } from "@/lib/adapter";
import { QK } from "@/lib/query-keys";
import type { ImportBatch } from "@/types/imports";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/imports/batches")({
  component: BatchesPage,
});

function fmtDt(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function BatchesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const params = useMemo(() => ({ page, page_size: pageSize, ...(search ? { search } : {}) }), [page, pageSize, search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.batches(params),
    queryFn: () => api.listBatches(params),
  });

  function toggleExpand(id: number) {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const columns = useMemo<ColumnDef<ImportBatch, unknown>[]>(() => [
    {
      id: "expand", header: "", enableSorting: false, size: 32,
      cell: ({ row }) => {
        const errors = row.original.errors ?? row.original.file_errors ?? [];
        if (!errors.length) return null;
        return (
          <button onClick={() => toggleExpand(row.original.id)} className="p-1 text-muted-foreground hover:text-foreground">
            {expanded.has(row.original.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        );
      },
    },
    {
      id: "ref", header: "Batch", enableSorting: false,
      cell: ({ row }) => {
        const ref = row.original.batch_ref ?? `#${row.original.id}`;
        return <span className="font-mono text-[11px]">{ref}</span>;
      },
    },
    { accessorKey: "started_at", header: "Started", enableSorting: false,
      cell: ({ getValue }) => <span className="text-muted-foreground">{fmtDt(getValue() as string)}</span> },
    { accessorKey: "completed_at", header: "Completed", enableSorting: false,
      cell: ({ getValue }) => <span className="text-muted-foreground">{fmtDt(getValue() as string)}</span> },
    {
      id: "source", header: "Source", enableSorting: false,
      cell: ({ row }) => {
        const src = row.original.source ?? row.original.source_directory ?? "—";
        return <span className="text-muted-foreground text-[11px] max-w-[160px] block truncate" title={src}>{src}</span>;
      },
    },
    {
      id: "files", header: "Files", enableSorting: false,
      cell: ({ row }) => <span className="numeric">{row.original.file_count ?? row.original.files_seen ?? "—"}</span>,
    },
    {
      id: "rows_seen", header: "Rows Seen", enableSorting: false,
      cell: ({ row }) => <span className="numeric">{(row.original.row_count ?? row.original.rows_seen ?? 0).toLocaleString("en-IN")}</span>,
    },
    { accessorKey: "rows_imported", header: "Imported", enableSorting: false,
      cell: ({ getValue }) => <span className="numeric text-success">{(getValue() as number ?? 0).toLocaleString("en-IN")}</span> },
    {
      id: "errors", header: "Errors", enableSorting: false,
      cell: ({ row }) => {
        const count = row.original.error_count ?? (row.original.errors?.length ?? 0);
        return <span className={cn("numeric font-medium", count > 0 ? "text-danger" : "text-muted-foreground")}>{count}</span>;
      },
    },
    {
      id: "status", header: "Status", enableSorting: false,
      cell: ({ row }) => {
        const s = row.original.status ?? "completed";
        const isOk = s === "completed";
        return (
          <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", isOk ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
            {isOk ? "Completed" : "With Warnings"}
          </span>
        );
      },
    },
  ], [expanded]);

  return (
    <AppShell title="Import Batches" breadcrumbs={[{ label: "Data Import" }, { label: "Import Batches" }]}>
      <div className="mb-4">
        <p className="text-[13px] text-muted-foreground">{data ? `${data.count.toLocaleString("en-IN")} batches` : ""}</p>
      </div>
      <DataTable
        columns={columns}
        data={data?.results ?? []}
        loading={isLoading}
        error={isError ? "Failed to load import batches." : null}
        onRetry={refetch}
        pagination={{ page, pageSize, total: data?.count ?? 0 }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search batches…"
      />
      {data?.results.filter((b) => expanded.has(b.id)).map((batch) => {
        const errs = batch.errors ?? batch.file_errors ?? [];
        return (
          <div key={batch.id} className="mt-2 border border-border rounded-lg p-3 bg-danger-soft/30">
            <p className="text-[12px] font-medium text-danger mb-2">Errors in batch {batch.batch_ref ?? `#${batch.id}`}</p>
            <div className="space-y-1">
              {errs.map((e, i) => (
                <div key={i} className="text-[11px] text-foreground flex gap-2">
                  <span className="text-muted-foreground font-mono">{e.file ?? ""}{e.sheet ? ` / ${e.sheet}` : ""}{e.row ? ` row ${e.row}` : ""}</span>
                  <span>{e.message}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </AppShell>
  );
}
