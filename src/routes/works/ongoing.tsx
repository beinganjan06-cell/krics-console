import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/works/ongoing")({
  beforeLoad: () => {
    throw redirect({ to: "/works" as never, search: { view: "ongoing" } as never });
  },
  component: () => null,
});
