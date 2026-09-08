import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/$")({
  component: ComingSoonPage,
});

function ComingSoonPage() {
  const { _splat } = Route.useParams();
  const segments = (_splat ?? "").split("/").filter(Boolean);
  const breadcrumbs = segments.map((s) => ({
    label: s
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
  }));

  const title =
    breadcrumbs.length > 0
      ? (breadcrumbs[breadcrumbs.length - 1]?.label ?? "Page")
      : "Page";

  return (
    <AppShell title={title} breadcrumbs={breadcrumbs}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="p-4 rounded-full bg-muted">
          <Construction size={32} className="text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-sm">
            This section is under development. Check back soon.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
