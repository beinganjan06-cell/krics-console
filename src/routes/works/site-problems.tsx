import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/works/site-problems")({
  beforeLoad: () => {
    throw redirect({ to: "/works" as never, search: { view: "site_problem" } as never });
  },
  component: () => null,
});
