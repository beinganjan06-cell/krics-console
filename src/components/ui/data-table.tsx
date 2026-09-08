import { flexRender, type SortingState } from "@tanstack/react-table";
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Columns3, Plus, Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/constants";

type ColumnDef<T, TValue = unknown> = LegacyColumnDef<T, TValue>;
type VisibilityState = Record<string, boolean>;

export interface ServerPaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  pagination: ServerPaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sorting?: SortingState;
  onSortingChange?: (s: SortingState) => void;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  addLabel?: string;
  onAdd?: () => void;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns, data, loading, error, onRetry,
  pagination, onPageChange, onPageSizeChange,
  sorting = [], onSortingChange,
  search, onSearchChange, searchPlaceholder = "Search…",
  toolbar, addLabel = "Add New", onAdd, onRowClick,
}: DataTableProps<T>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showVisMenu, setShowVisMenu] = useState(false);

  const table = useLegacyTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: onSortingChange as never,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: Math.ceil(pagination.total / pagination.pageSize),
  });

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {onSearchChange && (
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-[12px] border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {search && (
                <button onClick={() => onSearchChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          {toolbar}
        </div>
        <div className="relative ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowVisMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] border border-border rounded hover:bg-accent transition-colors"
          >
            <Columns3 size={13} /> Columns
          </button>
          {showVisMenu && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded shadow-raised p-2 min-w-[160px] space-y-1">
              {table.getAllLeafColumns().filter((c) => c.id !== "actions").map((col) => (
                <label key={col.id} className="flex items-center gap-2 text-[12px] cursor-pointer px-1 py-0.5 hover:bg-muted rounded">
                  <input type="checkbox" checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} className="w-3 h-3" />
                  {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                </label>
              ))}
            </div>
          )}
          {onAdd && (
            <Button size="sm" onClick={onAdd} className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary-dark">
              <Plus size={14} />
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-primary sticky top-0 z-10">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const isActions = header.column.id === "actions";
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-3 py-2.5 font-semibold text-primary-foreground whitespace-nowrap select-none",
                          isActions ? "text-right" : "text-left",
                          canSort && "cursor-pointer hover:bg-primary-dark/40",
                        )}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <div className={cn("flex items-center gap-1", isActions && "justify-end")}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-primary-foreground/70">
                              {sorted === "asc" ? <ChevronUp size={12} /> : sorted === "desc" ? <ChevronDown size={12} /> : <ChevronsUpDown size={11} />}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {columns.map((_, j) => (
                      <td key={j} className="px-3 py-2"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-[13px] text-danger">
                    {error}
                    {onRetry && <button onClick={onRetry} className="ml-2 underline">Retry</button>}
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-[13px] text-muted-foreground">No records found.</td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/50 hover:bg-primary-soft/60 transition-colors",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn("px-3 py-2 text-foreground", cell.column.id === "actions" && "text-right")}
                        onClick={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
            className="border border-border rounded px-1.5 py-0.5 bg-background text-foreground"
          >
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <span>{pagination.total === 0 ? "No records" : `Showing ${start}–${end} of ${pagination.total.toLocaleString("en-IN")}`}</span>
        <div className="flex items-center gap-1">
          <PagBtn onClick={() => onPageChange(1)} disabled={pagination.page === 1}>«</PagBtn>
          <PagBtn onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 1}>‹</PagBtn>
          {pageRange(pagination.page, totalPages).map((p, i) =>
            p === "…" ? <span key={`e${i}`} className="px-1">…</span> : (
              <PagBtn key={p} onClick={() => onPageChange(p as number)} active={p === pagination.page}>{p}</PagBtn>
            )
          )}
          <PagBtn onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}>›</PagBtn>
          <PagBtn onClick={() => onPageChange(totalPages)} disabled={pagination.page >= totalPages}>»</PagBtn>
        </div>
      </div>
    </div>
  );
}

function PagBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "min-w-[26px] h-[26px] px-1 rounded text-[12px] border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

function pageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

export { DEFAULT_PAGE_SIZE };
