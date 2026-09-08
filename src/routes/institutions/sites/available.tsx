import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/institutions/sites/available")({
  beforeLoad: () => {
    throw redirect({ to: "/institutions" as never, search: { status: "available" } as never });
  },
  component: () => null,
});
