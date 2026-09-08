import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  label: string;
  value: number | undefined;
  previous?: number | undefined;
  icon: React.ReactNode;
  loading?: boolean | undefined;
  colorClass?: string | undefined;
  onClick?: (() => void) | undefined;
}

export function MetricCard({ label, value, previous, icon, loading, colorClass, onClick }: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  const diff = value !== undefined && previous !== undefined ? value - previous : null;
  const pct = diff !== null && previous ? Math.round((diff / previous) * 100) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-lg p-4 text-left transition-shadow hover:shadow-raised w-full",
        onClick && "cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("p-2 rounded-md", colorClass ?? "bg-primary-soft text-primary")}>
          {icon}
        </div>
        {pct !== null && (
          <span className={cn("flex items-center gap-0.5 text-[11px] font-medium", pct > 0 ? "text-success" : pct < 0 ? "text-danger" : "text-muted-foreground")}>
            {pct > 0 ? <TrendingUp size={12} /> : pct < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(pct)}%
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold text-foreground numeric">{value?.toLocaleString("en-IN") ?? "—"}</div>
      <div className="mt-0.5 text-[12px] text-muted-foreground">{label}</div>
    </button>
  );
}
