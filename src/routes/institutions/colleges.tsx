import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/institutions/colleges")({
  beforeLoad: () => {
    throw redirect({ to: "/institutions" as never, search: { type: "PU College" } as never });
  },
  component: () => null,
});
