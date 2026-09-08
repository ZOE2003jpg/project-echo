import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const Route = createFileRoute("/login/marketer")({
  head: () => ({
    meta: [
      { title: "Marketer Login — Pitch Capital" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MarketerLoginRouteComponent,
});

function MarketerLoginRouteComponent() {
  return <AdminLoginForm expectedRole="Marketer" />;
}
