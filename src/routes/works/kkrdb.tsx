import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/works/kkrdb")({
  beforeLoad: () => {
    throw redirect({ to: "/works" as never, search: { view: "kkrdb" } as never });
  },
  component: () => null,
});
