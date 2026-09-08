import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/works/estimate-stage")({
  beforeLoad: () => {
    throw redirect({ to: "/works" as never, search: { view: "estimate_stage" } as never });
  },
  component: () => null,
});
