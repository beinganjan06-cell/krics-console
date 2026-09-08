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
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/adapter";
import { QK } from "@/lib/query-keys";
import { useMenuAccess } from "@/lib/auth/use-access";
import { menuIcon } from "@/lib/access";
import { cn } from "@/lib/utils";
import { emptyAccess, type AdminMenu, type AdminRole, type MenuAccess, type RoleAccessItem, type RolePayload } from "@/types/access";

export const Route = createFileRoute("/administration/roles")({
  component: RolesPage,
});

type DialogMode = "create" | "edit" | null;

const EMPTY: RolePayload = { name: "", code: "", description: "", is_active: true };

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}

function MenusPageAccessMap(access: RoleAccessItem[]): Record<number, MenuAccess> {
  const map: Record<number, MenuAccess> = {};
  for (const item of access) {
    map[item.menu_id] = {
      can_read: item.can_read,
      can_create: item.can_create,
      can_edit: item.can_edit,
      can_delete: item.can_delete,
    };
  }
  return map;
}

function RolesPage() {
  const queryClient = useQueryClient();
  const pageAccess = useMenuAccess();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<AdminRole | null>(null);
  const [accessRole, setAccessRole] = useState<AdminRole | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminRole | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.adminRoles(),
    queryFn: () => api.listRoles({ page_size: 200 }),
  });
  const { data: menuData } = useQuery({
    queryKey: QK.adminMenus(),
    queryFn: () => api.listMenus({ page_size: 500, ordering: "sort_order" }),
  });
  const rows = data?.results ?? [];
  const menus = menuData?.results ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.code} ${r.description}`.toLowerCase().includes(q));
  }, [rows, search]);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const saveMut = useMutation({
    mutationFn: async (payload: RolePayload) => {
      if (dialog === "edit" && selected) return api.updateRole(selected.id, payload);
      return api.createRole(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(dialog === "edit" ? "Role updated." : "Role created.");
      setDialog(null);
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (row: AdminRole) => api.updateRole(row.id, { is_active: !row.is_active }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const accessMut = useMutation({
    mutationFn: ({ id, access }: { id: number; access: RoleAccessItem[] }) => api.updateRoleAccess(id, access),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Menu access saved.");
      setAccessRole(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Role deleted.");
      setPendingDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ColumnDef<AdminRole>[] = useMemo(() => [
    {
      id: "si",
      header: "SI NO",
      enableSorting: false,
      cell: ({ row }) => <span className="numeric">{(page - 1) * pageSize + row.index + 1}</span>,
    },
    { accessorKey: "name", header: "ROLE" },
    { accessorKey: "code", header: "CODE" },
    {
      id: "access",
      header: "ACCESS",
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-[11px] font-semibold text-primary border-primary/30 bg-primary-soft/50"
          onClick={() => setAccessRole(row.original)}
        >
          EDIT ACCESS
        </Button>
      ),
    },
    {
      accessorKey: "is_active",
      header: "STATUS",
      cell: ({ getValue }) => <ActiveBadge active={Boolean(getValue())} />,
    },
    {
      accessorKey: "updated_at",
      header: "UPDATED",
      cell: ({ getValue }) => <span className="numeric">{fmtDate(getValue() as string)}</span>,
    },
    {
      id: "actions",
      header: "ACTION",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Switch
            checked={row.original.is_active}
            disabled={!pageAccess.can_edit}
            onCheckedChange={() => toggleMut.mutate(row.original)}
          />
          {pageAccess.can_edit && (
            <RowActions
              onEdit={() => { setSelected(row.original); setDialog("edit"); }}
              onDelete={pageAccess.can_delete ? () => setPendingDelete(row.original) : undefined}
            />
          )}
        </div>
      ),
    },
  ], [page, pageSize, pageAccess.can_edit, pageAccess.can_delete, toggleMut]);

  return (
    <AppShell>
      <DataTable
        columns={columns}
        data={pageRows}
        loading={isLoading}
        error={isError ? "Unable to load roles." : null}
        onRetry={() => void refetch()}
        pagination={{ page, pageSize, total: filtered.length }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        sorting={sorting}
        onSortingChange={(s) => { setSorting(s); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search roles by name, code, description, or permissions..."
        addLabel="ADD"
        onAdd={pageAccess.can_create ? () => { setSelected(null); setDialog("create"); } : undefined}
      />

      <RoleFormDialog
        open={dialog !== null}
        mode={dialog ?? "create"}
        record={selected}
        saving={saveMut.isPending}
        onOpenChange={(open) => { if (!open) { setDialog(null); setSelected(null); } }}
        onSubmit={(payload) => saveMut.mutateAsync(payload)}
      />

      <EditAccessDialog
        open={accessRole !== null}
        role={accessRole}
        menus={menus}
        saving={accessMut.isPending}
        onOpenChange={(open) => { if (!open) setAccessRole(null); }}
        onSave={(access) => accessRole && accessMut.mutate({ id: accessRole.id, access })}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Delete role?"
        description={pendingDelete ? `This will remove “${pendingDelete.name}”. Roles assigned to users cannot be deleted.` : ""}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
        onConfirm={() => { if (pendingDelete) void deleteMut.mutateAsync(pendingDelete.id); }}
      />
    </AppShell>
  );
}

function RoleFormDialog({
  open, mode, record, saving, onOpenChange, onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  record: AdminRole | null;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: RolePayload) => Promise<unknown>;
}) {
  const [form, setForm] = useState<RolePayload>(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({ name: record.name, code: record.code, description: record.description, is_active: record.is_active });
    } else {
      setForm(EMPTY);
    }
  }, [open, record]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? "Add Role" : "Edit Role"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="role-name">Name</Label>
            <Input id="role-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="role-code">Code</Label>
            <Input id="role-code" value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </div>
          <div>
            <Label htmlFor="role-desc">Description</Label>
            <Input id="role-desc" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <label className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2">
            <span className="text-sm">Active</span>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={saving || !form.name.trim() || !form.code.trim()}
            onClick={() => void onSubmit(form)}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditAccessDialog({
  open, role, menus, saving, onOpenChange, onSave,
}: {
  open: boolean;
  role: AdminRole | null;
  menus: AdminMenu[];
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (access: RoleAccessItem[]) => void;
}) {
  const [perms, setPerms] = useState<Record<number, MenuAccess>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !role) return;
    const map = MenusPageAccessMap(role.access ?? []);
    setPerms(map);
    const firstGranted = menus.find((m) => map[m.id]?.can_read) ?? menus[0];
    setSelectedId(firstGranted?.id ?? null);
  }, [open, role, menus]);

  const selected = menus.find((m) => m.id === selectedId) ?? null;
  const selectedPerm = (selected && perms[selected.id]) || emptyAccess();

  function toggleMenu(menu: AdminMenu, on: boolean) {
    setPerms((current) => {
      const next = { ...current };
      if (on) next[menu.id] = { ...(next[menu.id] ?? emptyAccess()), can_read: true };
      else delete next[menu.id];
      return next;
    });
    setSelectedId(menu.id);
  }

  function setFlag(key: keyof MenuAccess, value: boolean) {
    if (!selected) return;
    setPerms((current) => {
      const prev = current[selected.id] ?? emptyAccess();
      const next = { ...prev, [key]: value };
      if (key === "can_read" && !value) {
        next.can_create = false;
        next.can_edit = false;
        next.can_delete = false;
      }
      if (value && key !== "can_read") next.can_read = true;
      return { ...current, [selected.id]: next };
    });
  }

  const listed = [...menus].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>Edit Access — {role?.name ?? ""}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[240px_1fr] border-t border-border min-h-[420px]">
          <div className="border-r border-border overflow-y-auto max-h-[60vh]">
            {listed.map((menu) => {
              const Icon = menuIcon(menu.icon);
              const granted = Boolean(perms[menu.id]?.can_read || perms[menu.id]?.can_create || perms[menu.id]?.can_edit || perms[menu.id]?.can_delete);
              const active = menu.id === selectedId;
              return (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setSelectedId(menu.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] border-b border-border/60",
                    active ? "bg-primary-soft text-primary" : "hover:bg-muted/60",
                    !menu.is_active && "opacity-50",
                  )}
                >
                  <span onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={granted} onCheckedChange={(v) => toggleMenu(menu, v === true)} />
                  </span>
                  <Icon size={14} className="shrink-0" />
                  <span className="truncate">{menu.label}</span>
                </button>
              );
            })}
          </div>
          <div className="p-5">
            {selected ? (
              <>
                <h3 className="text-[13px] font-semibold mb-3">Menu: {selected.label}</h3>
                <div className="space-y-3">
                  {([
                    ["can_read", "Read"],
                    ["can_create", "Create"],
                    ["can_edit", "Edit"],
                    ["can_delete", "Delete"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-[13px]">
                      <Checkbox
                        checked={selectedPerm[key]}
                        onCheckedChange={(v) => setFlag(key, v === true)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground">Select a menu to set access.</p>
            )}
          </div>
        </div>
        <DialogFooter className="px-5 py-3 border-t border-border">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            disabled={saving}
            onClick={() => onSave(Object.entries(perms).map(([menu_id, perm]) => ({ menu_id: Number(menu_id), ...perm })))}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
