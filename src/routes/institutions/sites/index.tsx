import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/institutions/sites/")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/institutions",
      search: { status: search.status },
    } as never);
  },
  component: () => null,
});
