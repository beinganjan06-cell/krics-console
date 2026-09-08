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
import type { AdminRole, AdminUser, UserPayload } from "@/types/access";

export const Route = createFileRoute("/administration/users")({
  component: UsersPage,
});

type DialogMode = "create" | "edit" | null;

const EMPTY: UserPayload = {
  name: "", email: "", mobile: "", role: 0, is_active: true, password: "",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}

function UsersPage() {
  const queryClient = useQueryClient();
  const access = useMenuAccess();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.adminUsers(),
    queryFn: () => api.listUsers({ page_size: 200 }),
  });
  const { data: roleData } = useQuery({
    queryKey: QK.adminRoles(),
    queryFn: () => api.listRoles({ page_size: 200 }),
  });
  const rows = data?.results ?? [];
  const roles = (roleData?.results ?? []).filter((r) => r.is_active);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.email} ${r.mobile} ${r.role_name}`.toLowerCase().includes(q));
  }, [rows, search]);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const saveMut = useMutation({
    mutationFn: async (payload: UserPayload) => {
      if (dialog === "edit" && selected) {
        const body = { ...payload };
        if (!body.password) delete body.password;
        return api.updateUser(selected.id, body);
      }
      return api.createUser(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(dialog === "edit" ? "User updated." : "User created.");
      setDialog(null);
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (row: AdminUser) => api.updateUser(row.id, { is_active: !row.is_active }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("User removed.");
      setPendingDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: ColumnDef<AdminUser>[] = useMemo(() => [
    {
      id: "si",
      header: "SI NO",
      enableSorting: false,
      cell: ({ row }) => <span className="numeric">{(page - 1) * pageSize + row.index + 1}</span>,
    },
    { accessorKey: "name", header: "USER" },
    { accessorKey: "email", header: "EMAIL" },
    { accessorKey: "mobile", header: "MOBILE" },
    { accessorKey: "role_name", header: "ROLE" },
    {
      accessorKey: "is_active",
      header: "STATUS",
      cell: ({ getValue }) => <ActiveBadge active={Boolean(getValue())} />,
    },
    {
      accessorKey: "last_login",
      header: "LAST LOGIN",
      cell: ({ getValue }) => <span className="numeric text-muted-foreground">{fmtDate(getValue() as string | null)}</span>,
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
        error={isError ? "Unable to load users." : null}
        onRetry={() => void refetch()}
        pagination={{ page, pageSize, total: filtered.length }}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        sorting={sorting}
        onSortingChange={(s) => { setSorting(s); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search users by name, email, mobile, or role..."
        addLabel="ADD"
        onAdd={access.can_create ? () => { setSelected(null); setDialog("create"); } : undefined}
      />

      <UserFormDialog
        open={dialog !== null}
        mode={dialog ?? "create"}
        record={selected}
        roles={roles}
        saving={saveMut.isPending}
        onOpenChange={(open) => { if (!open) { setDialog(null); setSelected(null); } }}
        onSubmit={(payload) => saveMut.mutateAsync(payload)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Delete user?"
        description={pendingDelete ? `This will deactivate “${pendingDelete.name}”.` : ""}
        confirmLabel="Delete"
        loading={deleteMut.isPending}
        onConfirm={() => { if (pendingDelete) void deleteMut.mutateAsync(pendingDelete.id); }}
      />
    </AppShell>
  );
}

function UserFormDialog({
  open, mode, record, roles, saving, onOpenChange, onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  record: AdminUser | null;
  roles: AdminRole[];
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UserPayload) => Promise<unknown>;
}) {
  const [form, setForm] = useState<UserPayload>(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        name: record.name,
        username: record.username,
        email: record.email,
        mobile: record.mobile,
        role: record.role,
        is_active: record.is_active,
        password: "",
      });
    } else {
      setForm({ ...EMPTY, role: roles[0]?.id ?? 0 });
    }
  }, [open, record, roles]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "create" ? "Add User" : "Edit User"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="user-mobile">Mobile</Label>
            <Input id="user-mobile" value={form.mobile}
              onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="user-password">{mode === "create" ? "Password" : "New password (optional)"}</Label>
            <Input id="user-password" type="password" value={form.password ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: Number(e.target.value) }))}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2">
            <span className="text-sm">Active</span>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            disabled={saving || !form.name.trim() || !form.email.trim() || !form.role || (mode === "create" && !form.password)}
            onClick={() => void onSubmit(form)}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
