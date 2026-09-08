import { cn } from "@/lib/utils";

const SITE_STATUS: Record<string, { label: string; cls: string }> = {
  available:     { label: "Available",     cls: "bg-success-soft text-success" },
  not_available: { label: "Not Available", cls: "bg-muted text-muted-foreground" },
  problem:       { label: "Problem",       cls: "bg-danger-soft text-danger" },
  unknown:       { label: "Unknown",       cls: "bg-muted text-muted-foreground" },
};

const WORK_STATUS: Record<string, { label: string; cls: string }> = {
  ongoing:        { label: "Ongoing",        cls: "bg-info-soft text-info" },
  completed:      { label: "Completed",      cls: "bg-success-soft text-success" },
  tender_stage:   { label: "Tender Stage",   cls: "bg-warning-soft text-warning" },
  estimate_stage: { label: "Estimate Stage", cls: "bg-warning-soft text-warning" },
  site_problem:   { label: "Site Problem",   cls: "bg-danger-soft text-danger" },
  not_started:    { label: "Not Started",    cls: "bg-muted text-muted-foreground" },
  handed_over:    { label: "Handed Over",    cls: "bg-primary-soft text-primary" },
};

export function SiteStatusBadge({ status }: { status: string }) {
  const s = SITE_STATUS[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", s.cls)}>{s.label}</span>;
}

export function WorkStatusBadge({ status }: { status: string }) {
  const s = WORK_STATUS[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", s.cls)}>{s.label}</span>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground")}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}
