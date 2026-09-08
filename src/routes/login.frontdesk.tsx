import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const Route = createFileRoute("/login/frontdesk")({
  head: () => ({
    meta: [
      { title: "Front Desk Login — Pitch Capital" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: FrontDeskLoginRouteComponent,
});

function FrontDeskLoginRouteComponent() {
  return <AdminLoginForm expectedRole="Front Desk" />;
}
