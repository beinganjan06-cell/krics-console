import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable, DEFAULT_PAGE_SIZE } from "@/components/ui/data-table";
import { RowActions } from "@/components/ui/row-actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ActiveBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/adapter";
import { QK } from "@/lib/query-keys";
import { useMenuAccess } from "@/lib/auth/use-access";
import { menuIcon } from "@/lib/access";
import type { AdminMenu, MenuPayload } from "@/types/access";

export const Route = createFileRoute("/administration/menus")({
  component: MenusPage,
});

type DialogMode = "create" | "edit" | null;

const EMPTY: MenuPayload = {
  label: "",
  path: "",
  icon: "",
  sort_order: 1,
  parent: null,
  is_active: true,
};

function MenusPage() {
  const queryClient = useQueryClient();
  const access = useMenuAccess();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "sort_order", desc: false }]);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<AdminMenu | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminMenu | null>(null);

  const ordering = sorting.length ? `${sorting[0]!.desc ? "-" : ""}${sorting[0]!.id}` : "sort_order";
  const params = useMemo(
    () => ({ page, page_size: pageSize, ...(search ? { search } : {}), ordering }),
    [page, pageSize, search, ordering],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.adminMenus(),
    queryFn: () => api.listMenus({ ...params, page_size: 500 }),
  });
  const rows = data?.results ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.label} ${r.path} ${r.icon} ${r.parent_label ?? ""}`.toLowerCase().includes(q),
    );
  }, [rows, search]);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const saveMut = useMutation({
    mutationFn: async (payload: MenuPayload) => {
      if (dialog === "edit" && selected) return api.updateMenu(selected.id, payload);
      return api.createMenu(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(dialog === "edit" ? "Menu updated." : "Menu created.");
      setDialog(null);
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (row: AdminMenu) => api.updateMenu(row.id, { is_active: !row.is_active }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteMenu(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Menu removed.");
      setPendingDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ColumnDef<AdminMenu>[] = useMemo(() => [
    {
      id: "si",
      header: "SI NO",
      enableSorting: false,
      cell: ({ row }) => <span className="numeric">{(page - 1) * pageSize + row.index + 1}</span>,
    },
    { accessorKey: "label", header: "LABEL" },
    { accessorKey: "path", header: "PATH" },
    {
      accessorKey: "sort_order",
      header: "ORDER",
      cell: ({ getValue }) => <span className="numeric">{getValue() as number}</span>,
    },
    {
      accessorKey: "icon",
      header: "ICON",
      cell: ({ row }) => {
        const Icon = menuIcon(row.original.icon);
        return (
          <span className="inline-flex items-center gap-1.5">
            <Icon size={14} />
            <span className="text-muted-foreground">{row.original.icon || "—"}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "parent_label",
      header: "PARENT",
      cell: ({ getValue }) => (getValue() as string) || "—",
    },
    {
      accessorKey: "is_active",
      header: "STATUS",
      cell: ({ getValue }) => <ActiveBadge active={Boolean(getValue())} />,
    },
    {
      id: "actions",
      header: "ACTION",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Switch
            checked={row.original.is_active}
            disabled={!access.can_edit}
            onCheckedChange={() => toggleMut.mutate(row.original)}
          />
          {access.can_edit && (
            <RowActions
              onEdit={() => { setSelected(row.original); setDialog("edit"); }}
              onDelete={access.can_delete ? () => setPendingDelete(row.original) : undefined}
            />
          )}
        </div>
      ),
    },
  ], [page, pageSize, access.can_edit, access.can_delete, toggleMut]);

  return (
    <AppShell>
      <DataTable
        columns={columns}
        data={pageRows}
        loading={isLoading}
        error={isError ? "Unable to load menus." : null}
        onRetry={() => void refetch()}
        pagination={{ page, pageSize, total: filtered.length }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        sorting={sorting}
        onSortingChange={(s) => { setSorting(s); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search menu items by label, path, icon, or parent..."
        addLabel="ADD"
        onAdd={access.can_create ? () => { setSelected(null); setDialog("create"); } : undefined}
      />

      <MenuFormDialog
        open={dialog !== null}
        mode={dialog ?? "create"}
        record={selected}
        parents={rows}
        nextOrder={rows.length + 1}
        saving={saveMut.isPending}
        onOpenChange={(open) => { if (!open) { setDialog(null); setSelected(null); } }}
        onSubmit={(payload) => saveMut.mutateAsync(payload)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Delete menu?"
        description={pendingDelete ? `This will remove “${pendingDelete.label}” from role access.` : ""}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
        onConfirm={() => { if (pendingDelete) void deleteMut.mutateAsync(pendingDelete.id); }}
      />
    </AppShell>
  );
}

function MenuFormDialog({
  open, mode, record, parents, nextOrder, saving, onOpenChange, onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  record: AdminMenu | null;
  parents: AdminMenu[];
  nextOrder: number;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: MenuPayload) => Promise<unknown>;
}) {
  const [form, setForm] = useState<MenuPayload>(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        label: record.label,
        path: record.path,
        icon: record.icon,
        sort_order: record.sort_order,
        parent: record.parent,
        is_active: record.is_active,
      });
    } else {
      setForm({ ...EMPTY, sort_order: nextOrder });
    }
  }, [open, record, nextOrder]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? "Add Menu" : "Edit Menu"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="menu-label">Label</Label>
            <Input id="menu-label" value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="menu-path">Path</Label>
            <Input id="menu-path" value={form.path} placeholder="/administration/users"
              onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="menu-icon">Icon</Label>
            <Input id="menu-icon" value={form.icon} placeholder="LayoutDashboard"
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="menu-parent">Parent</Label>
            <select
              id="menu-parent"
              value={form.parent ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value ? Number(e.target.value) : null }))}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">— None —</option>
              {parents.filter((p) => p.id !== record?.id).map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="menu-order">Order</Label>
            <Input id="menu-order" type="number" value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
          </div>
          <label className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2">
            <span className="text-sm">Active</span>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={saving || !form.label.trim() || !form.path.trim()}
            onClick={() => void onSubmit(form)}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
