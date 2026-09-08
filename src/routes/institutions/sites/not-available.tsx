import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/institutions/sites/not-available")({
  beforeLoad: () => {
    throw redirect({ to: "/institutions" as never, search: { status: "not_available" } as never });
  },
  component: () => null,
});
