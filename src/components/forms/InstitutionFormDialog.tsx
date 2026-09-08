import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/adapter";
import { QK } from "@/lib/query-keys";
import type { Institution, SiteStatus } from "@/types/institutions";
import { SITE_STATUS_LABEL } from "@/types/institutions";
import { ApiError } from "@/types/api";

export type InstitutionPayload = {
  name: string;
  code: string;
  is_active: boolean;
  institution_type: number | null;
  category: number | null;
  division: number | null;
  district: number | null;
  taluk: number | null;
  constituency: number | null;
  hobli: number | null;
  academic_year: number | null;
  site_status: SiteStatus;
  student_capacity: number | null;
  site_details: string;
};

interface Props {
  open: boolean;
  mode: "create" | "edit" | "view";
  record: Institution | null;
  loadingRecord?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: InstitutionPayload) => Promise<void>;
  saving?: boolean;
}

const EMPTY: InstitutionPayload = {
  name: "",
  code: "",
  is_active: true,
  institution_type: null,
  category: null,
  division: null,
  district: null,
  taluk: null,
  constituency: null,
  hobli: null,
  academic_year: null,
  site_status: "available",
  student_capacity: null,
  site_details: "",
};

function fromRecord(record: Institution): InstitutionPayload {
  return {
    name: record.name ?? "",
    code: record.code ?? "",
    is_active: record.is_active !== false,
    institution_type: record.institution_type ?? null,
    category: record.category ?? null,
    division: record.division ?? null,
    district: record.district ?? null,
    taluk: record.taluk ?? null,
    constituency: record.constituency ?? null,
    hobli: record.hobli ?? null,
    academic_year: record.academic_year ?? null,
    site_status: (record.site_status as SiteStatus) || "available",
    student_capacity: record.student_capacity ?? null,
    site_details: record.site_details ?? "",
  };
}

export function InstitutionFormDialog({
  open, mode, record, loadingRecord, onOpenChange, onSubmit, saving,
}: Props) {
  const [form, setForm] = useState<InstitutionPayload>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const readOnly = mode === "view";

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(record ? fromRecord(record) : EMPTY);
  }, [open, record]);

  const masterParams = { page_size: 400, is_active: "true" as const };
  const { data: types } = useQuery({
    queryKey: QK.masters("institution-types", masterParams),
    queryFn: () => api.listMasters("institution-types", masterParams),
    enabled: open,
  });
  const { data: categories } = useQuery({
    queryKey: QK.masters("categories", masterParams),
    queryFn: () => api.listMasters("categories", masterParams),
    enabled: open,
  });
  const { data: divisions } = useQuery({
    queryKey: QK.masters("divisions", masterParams),
    queryFn: () => api.listMasters("divisions", masterParams),
    enabled: open,
  });
  const { data: districts } = useQuery({
    queryKey: QK.masters("districts", { page_size: 200, is_active: "true", division: form.division ?? "" }),
    queryFn: () => api.listMasters("districts", { page_size: 200, is_active: "true", ...(form.division ? { division: form.division } : {}) }),
    enabled: open,
  });
  const { data: years } = useQuery({
    queryKey: QK.masters("academic-years", masterParams),
    queryFn: () => api.listMasters("academic-years", masterParams),
    enabled: open,
  });
  const { data: taluks } = useQuery({
    queryKey: QK.masters("taluks", { page_size: 400, district: form.district ?? "", is_active: "true" }),
    queryFn: () => api.listMasters("taluks", { page_size: 400, district: form.district ?? undefined, is_active: "true" }),
    enabled: open && form.district != null,
  });
  const { data: constituencies } = useQuery({
    queryKey: QK.masters("constituencies", { page_size: 400, district: form.district ?? "", is_active: "true" }),
    queryFn: () => api.listMasters("constituencies", { page_size: 400, district: form.district ?? undefined, is_active: "true" }),
    enabled: open && form.district != null,
  });
  const { data: hoblis } = useQuery({
    queryKey: QK.masters("hoblis", { page_size: 400, taluk: form.taluk ?? "", is_active: "true" }),
    queryFn: () => api.listMasters("hoblis", { page_size: 400, taluk: form.taluk ?? undefined, is_active: "true" }),
    enabled: open && form.taluk != null,
  });

  async function handleSave() {
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    try {
      await onSubmit({ ...form, name: form.name.trim(), code: form.code.trim() });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to save institution.");
    }
  }

  const title = mode === "create" ? "Add Institution" : mode === "edit" ? "Edit Institution" : "View Institution";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {loadingRecord ? (
          <p className="text-[13px] text-muted-foreground py-6">Loading institution…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mode === "view" && record && (
              <Field label="ID"><p className="text-[13px] numeric">{record.id}</p></Field>
            )}
            <Field label="Name" className={mode === "view" ? "" : "sm:col-span-2"}>
              <Input disabled={readOnly} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Code">
              <Input disabled={readOnly} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            </Field>
            <Field label="Site status">
              <select
                disabled={readOnly}
                value={form.site_status}
                onChange={(e) => setForm((f) => ({ ...f, site_status: e.target.value as SiteStatus }))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {(Object.entries(SITE_STATUS_LABEL) as [SiteStatus, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <MasterSelect
                disabled={readOnly}
                value={form.institution_type}
                options={types?.results ?? []}
                placeholder="Select type"
                onChange={(id) => setForm((f) => ({ ...f, institution_type: id }))}
              />
            </Field>
            <Field label="Caste category">
              <MasterSelect
                disabled={readOnly}
                value={form.category}
                options={categories?.results ?? []}
                placeholder="Select category"
                onChange={(id) => setForm((f) => ({ ...f, category: id }))}
              />
            </Field>
            <Field label="Division">
              <MasterSelect
                disabled={readOnly}
                value={form.division}
                options={divisions?.results ?? []}
                placeholder="Select division"
                onChange={(id) => setForm((f) => ({ ...f, division: id, district: null, taluk: null, constituency: null, hobli: null }))}
              />
            </Field>
            <Field label="District">
              <MasterSelect
                disabled={readOnly}
                value={form.district}
                options={districts?.results ?? []}
                placeholder="Select district"
                onChange={(id) => {
                  const selected = districts?.results.find((d) => d.id === id);
                  setForm((f) => ({
                    ...f,
                    district: id,
                    division: selected?.division ?? f.division,
                    taluk: null,
                    constituency: null,
                    hobli: null,
                  }));
                }}
              />
            </Field>
            <Field label="Taluk">
              <MasterSelect
                disabled={readOnly || form.district == null}
                value={form.taluk}
                options={taluks?.results ?? []}
                placeholder="Select taluk"
                onChange={(id) => setForm((f) => ({ ...f, taluk: id, hobli: null }))}
              />
            </Field>
            <Field label="Constituency">
              <MasterSelect
                disabled={readOnly || form.district == null}
                value={form.constituency}
                options={constituencies?.results ?? []}
                placeholder="Select constituency"
                onChange={(id) => setForm((f) => ({ ...f, constituency: id }))}
              />
            </Field>
            <Field label="Hobli">
              <MasterSelect
                disabled={readOnly || form.taluk == null}
                value={form.hobli}
                options={hoblis?.results ?? []}
                placeholder="Select hobli"
                onChange={(id) => setForm((f) => ({ ...f, hobli: id }))}
              />
            </Field>
            <Field label="Academic year">
              <MasterSelect
                disabled={readOnly}
                value={form.academic_year}
                options={years?.results ?? []}
                placeholder="Select year"
                onChange={(id) => setForm((f) => ({ ...f, academic_year: id }))}
              />
            </Field>
            <Field label="Student capacity">
              <Input
                type="number"
                disabled={readOnly}
                value={form.student_capacity ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, student_capacity: e.target.value ? Number(e.target.value) : null }))}
              />
            </Field>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label htmlFor="inst-active">Active</Label>
              <Switch
                id="inst-active"
                checked={form.is_active}
                disabled={readOnly}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </div>
            <Field label="Site details" className="sm:col-span-2">
              <Textarea disabled={readOnly} rows={3} value={form.site_details} onChange={(e) => setForm((f) => ({ ...f, site_details: e.target.value }))} />
            </Field>
            {mode === "view" && record && (
              <>
                <Field label="Source file"><p className="text-[12px] break-all">{record.source_file || "—"}</p></Field>
                <Field label="Source sheet"><p className="text-[12px]">{record.source_sheet || "—"}</p></Field>
              </>
            )}
            {error && <p className="sm:col-span-2 text-[12px] text-danger">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{readOnly ? "Close" : "Cancel"}</Button>
          {!readOnly && <Button onClick={() => void handleSave()} disabled={saving || loadingRecord}>{saving ? "Saving…" : "Save"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MasterSelect({
  value, options, placeholder, disabled, onChange,
}: {
  value: number | null;
  options: { id: number; name: string }[];
  placeholder: string;
  disabled?: boolean;
  onChange: (id: number | null) => void;
}) {
  return (
    <select
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>{opt.name}</option>
      ))}
    </select>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label className="text-[12px]">{label}</Label>
      {children}
    </div>
  );
}
