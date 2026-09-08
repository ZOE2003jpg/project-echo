import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const Route = createFileRoute("/login/operations")({
  head: () => ({
    meta: [
      { title: "Operations & Disbursement Login — Pitch Capital" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OperationsLoginRouteComponent,
});

function OperationsLoginRouteComponent() {
  return <AdminLoginForm expectedRole="Operations & Disbursement" />;
}
