import { createFileRoute } from "@tanstack/react-router";
import { ReportPage } from "@/components/reports/ReportPage";

export const Route = createFileRoute("/reports/$slug")({
  component: ReportSlugPage,
});

function ReportSlugPage() {
  const { slug } = Route.useParams();
  return <ReportPage slug={slug} />;
}
