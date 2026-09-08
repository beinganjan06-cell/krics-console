import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/works/completed")({
  beforeLoad: () => {
    throw redirect({ to: "/works" as never, search: { view: "completed" } as never });
  },
  component: () => null,
});
