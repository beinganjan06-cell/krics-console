import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/institutions/sites/problems")({
  beforeLoad: () => {
    throw redirect({ to: "/institutions" as never, search: { status: "problem" } as never });
  },
  component: () => null,
});
