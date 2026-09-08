import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { QK } from "@/lib/query-keys";
import { PAGE_SIZES } from "@/lib/constants";
import { getSettings, listAudit, updateSettings, type AdminSettings } from "@/lib/admin-store";

export const Route = createFileRoute("/administration/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: QK.adminSettings(), queryFn: async () => getSettings() });
  const { data: audit = [] } = useQuery({ queryKey: QK.adminAudit(), queryFn: async () => listAudit() });
  const [form, setForm] = useState<AdminSettings | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async (payload: AdminSettings) => updateSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Settings saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <AppShell><p className="text-[13px] text-muted-foreground">Loading…</p></AppShell>;

  return (
    <AppShell>
      <div className="max-w-xl space-y-4 mb-8">
        <p className="text-[13px] text-muted-foreground">
          Console defaults. Audit logging records user, role, menu, and setting changes.
        </p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <Label htmlFor="org-name">Organisation name</Label>
            <Input id="org-name" value={form.org_name}
              onChange={(e) => setForm((f) => f && ({ ...f, org_name: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="session">Session timeout (minutes)</Label>
            <Input id="session" type="number" min={5} max={480} value={form.session_timeout_minutes}
              onChange={(e) => setForm((f) => f && ({ ...f, session_timeout_minutes: Number(e.target.value) }))} />
          </div>
          <div>
            <Label htmlFor="page-size">Default page size</Label>
            <select id="page-size" value={form.default_page_size}
              onChange={(e) => setForm((f) => f && ({ ...f, default_page_size: Number(e.target.value) }))}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <label className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Audit logging</div>
              <div className="text-[11px] text-muted-foreground">Record create / update / delete / access events</div>
            </div>
            <Switch checked={form.audit_logging}
              onCheckedChange={(v) => setForm((f) => f && ({ ...f, audit_logging: v }))} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Allow users to change their own role</div>
              <div className="text-[11px] text-muted-foreground">Keep off unless Super Admin needs it</div>
            </div>
            <Switch checked={form.allow_self_role_edit}
              onCheckedChange={(v) => setForm((f) => f && ({ ...f, allow_self_role_edit: v }))} />
          </label>
          <div className="flex justify-end">
            <Button type="button" disabled={saveMut.isPending} onClick={() => void saveMut.mutateAsync(form)}>
              {saveMut.isPending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </div>
      </div>

      <h2 className="text-[13px] font-semibold mb-3">Full audit log</h2>
      <AuditLogTable rows={audit} />
    </AppShell>
  );
}
