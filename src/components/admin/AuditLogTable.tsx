import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import type { AuditEntry } from "@/lib/admin-store";
import { DataTable, DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";

export function fmtDt(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ACTION_CLS: Record<string, string> = {
  create: "bg-success-soft text-success",
  update: "bg-info-soft text-info",
  delete: "bg-danger-soft text-danger",
  access: "bg-muted text-muted-foreground",
};

export function AuditLogTable({ rows }: { rows: AuditEntry[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter((r) =>
        `${r.actor} ${r.action} ${r.entity} ${r.detail}`.toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, search]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const columns: ColumnDef<AuditEntry>[] = useMemo(() => [
    {
      accessorKey: "at",
      header: "When",
      cell: ({ getValue }) => <span className="numeric text-muted-foreground">{fmtDt(getValue() as string)}</span>,
    },
    { accessorKey: "actor", header: "User" },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ getValue }) => {
        const v = String(getValue());
        return (
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium capitalize ${ACTION_CLS[v] ?? "bg-muted"}`}>
            {v}
          </span>
        );
      },
    },
    { accessorKey: "entity", header: "Module", cell: ({ getValue }) => <span className="capitalize">{String(getValue())}</span> },
    { accessorKey: "detail", header: "Detail", enableSorting: false },
  ], []);

  return (
    <DataTable
      columns={columns}
      data={pageRows}
      pagination={{ page, pageSize, total: filtered.length }}
      onPageChange={setPage}
      onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      sorting={sorting}
      onSortingChange={(s) => { setSorting(s); setPage(1); }}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(1); }}
      searchPlaceholder="Search audit log…"
    />
  );
}
