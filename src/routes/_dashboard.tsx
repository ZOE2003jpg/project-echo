import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSession, getRole } from "@/lib/admin-auth";
import { DashboardLayout } from "@/components/admin/DashboardLayout";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayoutWrapper,
});

function DashboardLayoutWrapper() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const s = getSession();
    const role = getRole();
    
    // Auth Guard
    if (!s) {
      // Not logged in: redirect to the login page specific to the attempted path
      if (pathname.startsWith("/frontdesk")) {
        navigate({ to: "/login/frontdesk", replace: true });
      } else if (pathname.startsWith("/marketer")) {
        navigate({ to: "/login/marketer", replace: true });
      } else if (pathname.startsWith("/operations")) {
        navigate({ to: "/login/operations", replace: true });
      } else {
        navigate({ to: "/admin/login", replace: true });
      }
      return;
    }

    setAuthed(true);
    setChecked(true);

    // Role Enforcement — only redirect if the destination is NOT a shared admin path
    // Shared paths (/admin/profile, /admin/application*, /admin/applications) are handled
    // by the /admin layout; don't bounce the user back during route transitions.
    const sharedAdminPrefixes = ["/admin/profile", "/admin/application", "/admin/applications"];
    const isSharedAdminPath = sharedAdminPrefixes.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!isSharedAdminPath) {
      if (role === "Front Desk" && !pathname.startsWith("/frontdesk")) {
        navigate({ to: "/frontdesk", replace: true });
      } else if (role === "Marketer" && !pathname.startsWith("/marketer")) {
        navigate({ to: "/marketer", replace: true });
      } else if (role === "Operations & Disbursement" && !pathname.startsWith("/operations")) {
        navigate({ to: "/operations", replace: true });
      } else if (role === "Administrator") {
        navigate({ to: "/admin", replace: true });
      }
    }
  }, [navigate, pathname]);

  if (!checked || !authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <DashboardLayout />;
}
