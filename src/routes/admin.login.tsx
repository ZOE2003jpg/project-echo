import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Pitch Capital" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLoginRouteComponent,
});

function AdminLoginRouteComponent() {
  return <AdminLoginForm expectedRole="Administrator" />;
}
