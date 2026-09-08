import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { MasterPayload, MasterRecord, MasterResource } from "@/types/masters";
import { getMasterConfig } from "@/types/masters";
import { api } from "@/lib/adapter";
import { useQuery } from "@tanstack/react-query";
import { QK } from "@/lib/query-keys";
import { ApiError } from "@/types/api";

interface MasterFormDialogProps {
  open: boolean;
  mode: "create" | "edit" | "view";
  resource: MasterResource;
  record: MasterRecord | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: MasterPayload) => Promise<void>;
  saving?: boolean;
}

const EMPTY: MasterPayload = { name: "", code: "", is_active: true, division: null, district: null, taluk: null };

export function MasterFormDialog({
  open, mode, resource, record, onOpenChange, onSubmit, saving,
}: MasterFormDialogProps) {
  const config = getMasterConfig(resource);
  const [form, setForm] = useState<MasterPayload>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const readOnly = mode === "view";

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    if (record) {
      setForm({
        name: record.name,
        code: record.code ?? "",
        is_active: record.is_active,
        division: record.division ?? null,
        district: record.district ?? null,
        taluk: record.taluk ?? null,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, record]);

  const { data: divisions } = useQuery({
    queryKey: QK.masters("divisions", { page_size: 50, is_active: "true" }),
    queryFn: () => api.listMasters("divisions", { page_size: 50, is_active: "true" }),
    enabled: open && config.parent === "division",
  });
  const { data: districts } = useQuery({
    queryKey: QK.masters("districts", { page_size: 200, is_active: "true" }),
    queryFn: () => api.listMasters("districts", { page_size: 200, is_active: "true" }),
    enabled: open && config.parent === "district",
  });
  const { data: taluks } = useQuery({
    queryKey: QK.masters("taluks", { page_size: 400, is_active: "true" }),
    queryFn: () => api.listMasters("taluks", { page_size: 400, is_active: "true" }),
    enabled: open && config.parent === "taluk",
  });

  const title = useMemo(() => {
    if (mode === "create") return `Add ${config.singular}`;
    if (mode === "edit") return `Edit ${config.singular}`;
    return `View ${config.singular}`;
  }, [mode, config.singular]);

  async function handleSave() {
    setFieldErrors({});
    if (!form.name.trim()) {
      setFieldErrors({ name: ["Name is required."] });
      return;
    }
    if (config.parentRequired && config.parent === "district" && !form.district) {
      setFieldErrors({ district: ["District is required."] });
      return;
    }
    try {
      await onSubmit({
        name: form.name.trim(),
        code: form.code?.trim() || null,
        is_active: form.is_active,
        division: form.division ?? null,
        district: form.district ?? null,
        taluk: form.taluk ?? null,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        if (!Object.keys(error.fieldErrors).length) setFieldErrors({ name: [error.message] });
      }
    }
  }

  function err(key: string) {
    return fieldErrors[key]?.[0];
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-1">
          {mode === "view" && record && (
            <Field label="ID"><p className="text-[13px] numeric">{record.id}</p></Field>
          )}
          <Field label="Name" error={err("name")} required>
            <Input
              value={form.name}
              disabled={readOnly}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Code" error={err("code")}>
            <Input
              value={form.code ?? ""}
              disabled={readOnly}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </Field>
          {config.parent === "division" && (
            <Field label="Division" error={err("division")}>
              <select
                disabled={readOnly}
                value={form.division ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, division: e.target.value ? Number(e.target.value) : null }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Select division</option>
                {divisions?.results.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          )}
          {config.parent === "district" && (
            <Field label="District" error={err("district")} required={config.parentRequired}>
              <select
                disabled={readOnly}
                value={form.district ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value ? Number(e.target.value) : null }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Select district</option>
                {districts?.results.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          )}
          {config.parent === "taluk" && (
            <Field label="Taluk" error={err("taluk")}>
              <select
                disabled={readOnly}
                value={form.taluk ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, taluk: e.target.value ? Number(e.target.value) : null }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Select taluk</option>
                {taluks?.results.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          )}
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="is-active">Active</Label>
            <Switch
              id="is-active"
              checked={form.is_active}
              disabled={readOnly}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{readOnly ? "Close" : "Cancel"}</Button>
          {!readOnly && (
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, children, error, required,
}: { label: string; children: React.ReactNode; error?: string; required?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[12px]">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
