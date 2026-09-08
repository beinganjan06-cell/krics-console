import type { ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, HardHat, School, Home, GraduationCap,
  Activity, CheckCircle2, AlertTriangle, RefreshCw,
  MapPin, CheckCircle, XCircle,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/adapter";
import { WORK_STATUS_LABEL, type WorkStatusKey } from "@/types/works";
import type { DashboardSiteCard, DashboardSummary, DashboardTotalKey } from "@/types/reports";
import { cn } from "@/lib/utils";

const KPI_META: Record<
  DashboardTotalKey,
  { icon: ReactNode; colorClass?: string; href: { to: string; search?: Record<string, string> } }
> = {
  institutions: { icon: <Building2 size={16} />, href: { to: "/institutions" } },
  residential_schools: {
    icon: <School size={16} />,
    colorClass: "bg-info-soft text-info",
    href: { to: "/institutions", search: { type: "Residential School" } },
  },
  hostels: {
    icon: <Home size={16} />,
    colorClass: "bg-success-soft text-success",
    href: { to: "/institutions", search: { type: "Hostel" } },
  },
  pu_colleges: {
    icon: <GraduationCap size={16} />,
    colorClass: "bg-warning-soft text-warning",
    href: { to: "/institutions", search: { type: "PU College" } },
  },
  works: { icon: <HardHat size={16} />, href: { to: "/works" } },
  ongoing_works: {
    icon: <Activity size={16} />,
    colorClass: "bg-info-soft text-info",
    href: { to: "/works", search: { view: "ongoing" } },
  },
  completed_works: {
    icon: <CheckCircle2 size={16} />,
    colorClass: "bg-success-soft text-success",
    href: { to: "/works", search: { view: "completed" } },
  },
  site_problem_records: {
    icon: <AlertTriangle size={16} />,
    colorClass: "bg-danger-soft text-danger",
    href: { to: "/institutions", search: { status: "problem" } },
  },
};

const SITE_META: Record<DashboardSiteCard["status"], { icon: ReactNode; boxClass: string; valueClass: string; labelClass: string }> = {
  available: {
    icon: <CheckCircle size={20} className="text-success shrink-0" />,
    boxClass: "bg-success-soft",
    valueClass: "text-success",
    labelClass: "text-success/80",
  },
  not_available: {
    icon: <XCircle size={20} className="text-muted-foreground shrink-0" />,
    boxClass: "bg-muted",
    valueClass: "text-foreground",
    labelClass: "text-muted-foreground",
  },
  problem: {
    icon: <MapPin size={20} className="text-danger shrink-0" />,
    boxClass: "bg-danger-soft",
    valueClass: "text-danger",
    labelClass: "text-danger/80",
  },
};

function kpiMetrics(data: DashboardSummary | undefined) {
  if (data?.kpi_metrics?.length) return data.kpi_metrics;
  if (!data) return [];
  return [
    { key: "institutions" as const, label: "Total Institutions", value: data.totals.institutions },
    { key: "residential_schools" as const, label: "Residential Schools", value: data.totals.residential_schools },
    { key: "hostels" as const, label: "Hostels", value: data.totals.hostels },
    { key: "pu_colleges" as const, label: "PU Colleges", value: data.totals.pu_colleges },
    { key: "works" as const, label: "Total Works", value: data.totals.works },
    { key: "ongoing_works" as const, label: "Ongoing Works", value: data.totals.ongoing_works },
    { key: "completed_works" as const, label: "Completed Works", value: data.totals.completed_works },
    { key: "site_problem_records" as const, label: "Site Problems", value: data.totals.site_problem_records },
  ];
}

function siteCards(data: DashboardSummary | undefined): DashboardSiteCard[] {
  if (data?.site_cards?.length) return data.site_cards;
  if (!data) return [];
  return [
    { status: "available", label: "Site Available", count: data.site_snapshot.available },
    { status: "not_available", label: "Site Not Available", count: data.site_snapshot.not_available },
    { status: "problem", label: "Site Problems", count: data.site_snapshot.problem },
  ];
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const STATUS_COLORS: Record<WorkStatusKey, string> = {
  ongoing: "#2563eb",
  completed: "#15803d",
  tender_stage: "#b45309",
  estimate_stage: "#d97706",
  site_problem: "#b42318",
  not_started: "#6b7280",
  handed_over: "#0f766e",
};

const STATUS_BADGE: Record<WorkStatusKey, string> = {
  ongoing: "bg-info-soft text-info",
  completed: "bg-success-soft text-success",
  tender_stage: "bg-warning-soft text-warning",
  estimate_stage: "bg-warning-soft text-warning",
  site_problem: "bg-danger-soft text-danger",
  not_started: "bg-muted text-muted-foreground",
  handed_over: "bg-primary-soft text-primary",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboardSummary({}),
  });

  const statusDist = data?.work_status_distribution.filter((d) => d.count > 0) ?? [];
  const districtWorks = data?.district_works.slice(0, 10) ?? [];
  const progressByDistrict = data?.progress_by_district ?? [];

  return (
    <AppShell title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[13px] text-muted-foreground">Current institution coverage and construction progress</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] border border-border rounded hover:bg-accent transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {isError && (
        <div className="mb-4 p-3 bg-danger-soft text-danger rounded-lg text-[13px] flex items-center gap-2">
          <AlertTriangle size={15} />
          Failed to load dashboard data.
          <button onClick={() => refetch()} className="underline ml-1">Retry</button>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {kpiMetrics(data).map((metric) => {
          const meta = KPI_META[metric.key];
          return (
            <MetricCard
              key={metric.key}
              loading={isLoading}
              label={metric.label}
              value={metric.value}
              previous={data?.previous_period[metric.key]}
              icon={meta.icon}
              colorClass={meta.colorClass}
              onClick={() => navigate({ to: meta.href.to, search: meta.href.search } as never)}
            />
          );
        })}
        {isLoading && !data && Array.from({ length: 8 }).map((_, index) => (
          <MetricCard key={`kpi-skeleton-${index}`} loading label="" value={undefined} icon={<Building2 size={16} />} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Work status donut */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-[13px] font-semibold text-foreground mb-3">Work Status Distribution</h2>
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusDist} dataKey="count" nameKey="status"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2}>
                    {statusDist.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, WORK_STATUS_LABEL[n as WorkStatusKey] ?? n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                {statusDist.map((d) => (
                  <div key={d.status} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.status] }} />
                    <span className="text-muted-foreground truncate">{WORK_STATUS_LABEL[d.status]}</span>
                    <span className="ml-auto font-medium text-foreground numeric">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* District works bar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h2 className="text-[13px] font-semibold text-foreground mb-3">Works by District</h2>
          {isLoading ? <Skeleton className="h-52 w-full" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={districtWorks} layout="vertical"
                margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="district" tick={{ fontSize: 11 }} width={110} />
                <Tooltip />
                <Bar dataKey="works" fill="#0f766e" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Financial vs Physical progress */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <h2 className="text-[13px] font-semibold text-foreground mb-3">Financial vs Physical Progress by District</h2>
        {isLoading ? <Skeleton className="h-52 w-full" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={progressByDistrict} margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="district" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }}
                label={{ value: "Rs. Lakh", angle: -90, position: "insideLeft", fontSize: 10, dy: 30 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]}
                label={{ value: "%", angle: 90, position: "insideRight", fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="financial_lakh" name="Financial (Rs. Lakh)" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="physical_pct" name="Physical (%)" fill="#15803d" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent works */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h2 className="text-[13px] font-semibold text-foreground mb-3">Recent Work Updates</h2>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1.5 pr-3 font-medium">Work</th>
                    <th className="text-left py-1.5 pr-3 font-medium">District</th>
                    <th className="text-left py-1.5 pr-3 font-medium">Status</th>
                    <th className="text-right py-1.5 pr-3 font-medium">Progress</th>
                    <th className="text-right py-1.5 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent_works ?? []).map((w) => (
                    <tr key={w.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                      <td className="py-1.5 pr-3 max-w-[180px] truncate text-foreground" title={w.name}>{w.name}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{w.district}</td>
                      <td className="py-1.5 pr-3">
                        <span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", STATUS_BADGE[w.status])}>
                          {WORK_STATUS_LABEL[w.status]}
                        </span>
                      </td>
                      <td className="py-1.5 pr-3 text-right numeric">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${w.physical_progress ?? 0}%` }} />
                          </div>
                          <span className="text-muted-foreground w-8 text-right">{w.physical_progress ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-1.5 text-right text-muted-foreground">{fmtDate(w.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Site snapshot */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-[13px] font-semibold text-foreground mb-3">Site Availability</h2>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {siteCards(data).map((card) => {
                const meta = SITE_META[card.status];
                return (
                  <button
                    key={card.status}
                    onClick={() => navigate({ to: "/institutions", search: { status: card.status } } as never)}
                    className={cn("w-full flex items-center gap-3 p-3 rounded-lg hover:opacity-90 transition-opacity text-left", meta.boxClass)}
                  >
                    {meta.icon}
                    <div>
                      <div className={cn("text-xl font-bold numeric", meta.valueClass)}>{card.count.toLocaleString("en-IN")}</div>
                      <div className={cn("text-[11px]", meta.labelClass)}>{card.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
