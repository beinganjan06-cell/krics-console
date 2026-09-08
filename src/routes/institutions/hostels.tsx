import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/institutions/hostels")({
  beforeLoad: () => {
    throw redirect({ to: "/institutions" as never, search: { type: "Hostel" } as never });
  },
  component: () => null,
});
