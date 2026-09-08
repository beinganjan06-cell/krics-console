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
import type { Work } from "@/types/works";
import { ApiError } from "@/types/api";

export type WorkPayload = {
  name: string;
  code: string;
  work_type: string;
  is_active: boolean;
  institution: number | null;
  category: number | null;
  district: number | null;
  taluk: number | null;
  constituency: number | null;
  academic_year: number | null;
  scheme: number | null;
  agency: number | null;
  status: number | null;
  approval_reference: string;
  contractor_name: string;
  estimate_amount_lakh: number | null;
  contract_amount_lakh: number | null;
  revised_amount_lakh: number | null;
  financial_progress_lakh: number | null;
  physical_progress_percent: number | null;
  work_order_date: string;
  site_handover_date: string;
  start_date: string;
  due_date: string;
  extension_date: string;
  completion_date: string;
  site_details: string;
  progress_details: string;
  remarks: string;
};

interface Props {
  open: boolean;
  mode: "create" | "edit" | "view";
  record: Work | null;
  loadingRecord?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: WorkPayload) => Promise<void>;
  saving?: boolean;
}

const EMPTY: WorkPayload = {
  name: "",
  code: "",
  work_type: "",
  is_active: true,
  institution: null,
  category: null,
  district: null,
  taluk: null,
  constituency: null,
  academic_year: null,
  scheme: null,
  agency: null,
  status: null,
  approval_reference: "",
  contractor_name: "",
  estimate_amount_lakh: null,
  contract_amount_lakh: null,
  revised_amount_lakh: null,
  financial_progress_lakh: null,
  physical_progress_percent: null,
  work_order_date: "",
  site_handover_date: "",
  start_date: "",
  due_date: "",
  extension_date: "",
  completion_date: "",
  site_details: "",
  progress_details: "",
  remarks: "",
};

function dateVal(value: string | null | undefined) {
  return (value ?? "").slice(0, 10);
}

function fromRecord(record: Work): WorkPayload {
  return {
    name: record.name ?? "",
    code: record.code ?? "",
    work_type: record.work_type ?? "",
    is_active: record.is_active !== false,
    institution: record.institution ?? null,
    category: record.category ?? null,
    district: record.district ?? null,
    taluk: record.taluk ?? null,
    constituency: record.constituency ?? null,
    academic_year: record.academic_year ?? null,
    scheme: record.scheme ?? null,
    agency: record.agency ?? null,
    status: record.status ?? null,
    approval_reference: record.approval_reference ?? "",
    contractor_name: record.contractor_name ?? "",
    estimate_amount_lakh: record.estimate_amount_lakh ?? null,
    contract_amount_lakh: record.contract_amount_lakh ?? null,
    revised_amount_lakh: record.revised_amount_lakh ?? null,
    financial_progress_lakh: record.financial_progress_lakh ?? null,
    physical_progress_percent: record.physical_progress_percent ?? null,
    work_order_date: dateVal(record.work_order_date),
    site_handover_date: dateVal(record.site_handover_date),
    start_date: dateVal(record.start_date),
    due_date: dateVal(record.due_date),
    extension_date: dateVal(record.extension_date),
    completion_date: dateVal(record.completion_date),
    site_details: record.site_details ?? "",
    progress_details: record.progress_details ?? "",
    remarks: record.remarks ?? "",
  };
}

const ACTIVE = { page_size: 400, is_active: "true" as const };

export function WorkFormDialog({
  open, mode, record, loadingRecord, onOpenChange, onSubmit, saving,
}: Props) {
  const [form, setForm] = useState<WorkPayload>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const readOnly = mode === "view";

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(record ? fromRecord(record) : EMPTY);
  }, [open, record]);

  const { data: districts } = useQuery({
    queryKey: QK.masters("districts", { page_size: 200, is_active: "true" }),
    queryFn: () => api.listMasters("districts", { page_size: 200, is_active: "true" }),
    enabled: open,
  });
  const { data: categories } = useQuery({
    queryKey: QK.masters("categories", ACTIVE),
    queryFn: () => api.listMasters("categories", ACTIVE),
    enabled: open,
  });
  const { data: statuses } = useQuery({
    queryKey: QK.masters("work-statuses", ACTIVE),
    queryFn: () => api.listMasters("work-statuses", ACTIVE),
    enabled: open,
  });
  const { data: agencies } = useQuery({
    queryKey: QK.masters("agencies", ACTIVE),
    queryFn: () => api.listMasters("agencies", ACTIVE),
    enabled: open,
  });
  const { data: schemes } = useQuery({
    queryKey: QK.masters("schemes", ACTIVE),
    queryFn: () => api.listMasters("schemes", ACTIVE),
    enabled: open,
  });
  const { data: years } = useQuery({
    queryKey: QK.masters("academic-years", ACTIVE),
    queryFn: () => api.listMasters("academic-years", ACTIVE),
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
  const { data: institutions } = useQuery({
    queryKey: QK.institutions({ page_size: 200, district: form.district ?? "", is_active: "true" }),
    queryFn: () => api.listInstitutions({ page_size: 200, district: form.district ?? undefined, is_active: "true" }),
    enabled: open && form.district != null,
  });

  async function handleSave() {
    setError(null);
    if (!form.name.trim()) {
      setError("Work name is required.");
      return;
    }
    try {
      await onSubmit({ ...form, name: form.name.trim(), code: form.code.trim() });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to save work.");
    }
  }

  const title = mode === "create" ? "Add Work" : mode === "edit" ? "Edit Work" : "View Work";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {loadingRecord ? (
          <p className="text-[13px] text-muted-foreground py-6">Loading work…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mode === "view" && record && (
              <Field label="ID"><p className="text-[13px] numeric">{record.id}</p></Field>
            )}
            <Field label="Work name" className={mode === "view" ? "" : "sm:col-span-2"}>
              <Input disabled={readOnly} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Code">
              <Input disabled={readOnly} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            </Field>
            <Field label="Work type">
              <Input disabled={readOnly} value={form.work_type} onChange={(e) => setForm((f) => ({ ...f, work_type: e.target.value }))} />
            </Field>
            <Field label="Status">
              <MasterSelect
                disabled={readOnly}
                value={form.status}
                options={statuses?.results ?? []}
                placeholder="Select status"
                onChange={(id) => setForm((f) => ({ ...f, status: id }))}
              />
            </Field>
            <Field label="District">
              <MasterSelect
                disabled={readOnly}
                value={form.district}
                options={districts?.results ?? []}
                placeholder="Select district"
                onChange={(id) => setForm((f) => ({ ...f, district: id, taluk: null, constituency: null, institution: null }))}
              />
            </Field>
            <Field label="Taluk">
              <MasterSelect
                disabled={readOnly || form.district == null}
                value={form.taluk}
                options={taluks?.results ?? []}
                placeholder="Select taluk"
                onChange={(id) => setForm((f) => ({ ...f, taluk: id }))}
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
            <Field label="Institution">
              <MasterSelect
                disabled={readOnly || form.district == null}
                value={form.institution}
                options={(institutions?.results ?? []).map((row) => ({ id: row.id, name: row.name }))}
                placeholder="Select institution"
                onChange={(id) => setForm((f) => ({ ...f, institution: id }))}
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
            <Field label="Agency">
              <MasterSelect
                disabled={readOnly}
                value={form.agency}
                options={agencies?.results ?? []}
                placeholder="Select agency"
                onChange={(id) => setForm((f) => ({ ...f, agency: id }))}
              />
            </Field>
            <Field label="Scheme">
              <MasterSelect
                disabled={readOnly}
                value={form.scheme}
                options={schemes?.results ?? []}
                placeholder="Select scheme"
                onChange={(id) => setForm((f) => ({ ...f, scheme: id }))}
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
            <Field label="Approval reference">
              <Input disabled={readOnly} value={form.approval_reference} onChange={(e) => setForm((f) => ({ ...f, approval_reference: e.target.value }))} />
            </Field>
            <Field label="Contractor">
              <Input disabled={readOnly} value={form.contractor_name} onChange={(e) => setForm((f) => ({ ...f, contractor_name: e.target.value }))} />
            </Field>
            <Field label="Estimate (Rs. lakh)">
              <Input type="number" disabled={readOnly} value={form.estimate_amount_lakh ?? ""} onChange={(e) => setForm((f) => ({ ...f, estimate_amount_lakh: e.target.value ? Number(e.target.value) : null }))} />
            </Field>
            <Field label="Contract (Rs. lakh)">
              <Input type="number" disabled={readOnly} value={form.contract_amount_lakh ?? ""} onChange={(e) => setForm((f) => ({ ...f, contract_amount_lakh: e.target.value ? Number(e.target.value) : null }))} />
            </Field>
            <Field label="Revised (Rs. lakh)">
              <Input type="number" disabled={readOnly} value={form.revised_amount_lakh ?? ""} onChange={(e) => setForm((f) => ({ ...f, revised_amount_lakh: e.target.value ? Number(e.target.value) : null }))} />
            </Field>
            <Field label="Financial progress (Rs. lakh)">
              <Input type="number" disabled={readOnly} value={form.financial_progress_lakh ?? ""} onChange={(e) => setForm((f) => ({ ...f, financial_progress_lakh: e.target.value ? Number(e.target.value) : null }))} />
            </Field>
            <Field label="Physical progress (%)">
              <Input type="number" min={0} max={100} disabled={readOnly} value={form.physical_progress_percent ?? ""} onChange={(e) => setForm((f) => ({ ...f, physical_progress_percent: e.target.value ? Number(e.target.value) : null }))} />
            </Field>
            <Field label="Work order date">
              <Input type="date" disabled={readOnly} value={form.work_order_date} onChange={(e) => setForm((f) => ({ ...f, work_order_date: e.target.value }))} />
            </Field>
            <Field label="Site handover date">
              <Input type="date" disabled={readOnly} value={form.site_handover_date} onChange={(e) => setForm((f) => ({ ...f, site_handover_date: e.target.value }))} />
            </Field>
            <Field label="Start date">
              <Input type="date" disabled={readOnly} value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
            </Field>
            <Field label="Due date">
              <Input type="date" disabled={readOnly} value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
            </Field>
            <Field label="Extension date">
              <Input type="date" disabled={readOnly} value={form.extension_date} onChange={(e) => setForm((f) => ({ ...f, extension_date: e.target.value }))} />
            </Field>
            <Field label="Completion date">
              <Input type="date" disabled={readOnly} value={form.completion_date} onChange={(e) => setForm((f) => ({ ...f, completion_date: e.target.value }))} />
            </Field>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 sm:col-span-2">
              <Label htmlFor="work-active">Active</Label>
              <Switch
                id="work-active"
                checked={form.is_active}
                disabled={readOnly}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </div>
            <Field label="Site details" className="sm:col-span-2">
              <Textarea disabled={readOnly} rows={2} value={form.site_details} onChange={(e) => setForm((f) => ({ ...f, site_details: e.target.value }))} />
            </Field>
            <Field label="Progress details" className="sm:col-span-2">
              <Textarea disabled={readOnly} rows={2} value={form.progress_details} onChange={(e) => setForm((f) => ({ ...f, progress_details: e.target.value }))} />
            </Field>
            <Field label="Remarks" className="sm:col-span-2">
              <Textarea disabled={readOnly} rows={2} value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
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
