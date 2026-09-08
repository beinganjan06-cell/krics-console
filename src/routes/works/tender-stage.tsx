import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/works/tender-stage")({
  beforeLoad: () => {
    throw redirect({ to: "/works" as never, search: { view: "tender_stage" } as never });
  },
  component: () => null,
});
