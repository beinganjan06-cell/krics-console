import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/institutions/schools")({
  beforeLoad: () => {
    throw redirect({ to: "/institutions" as never, search: { type: "Residential School" } as never });
  },
  component: () => null,
});
