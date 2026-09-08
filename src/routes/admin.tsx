import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSession, getRole } from "@/lib/admin-auth";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Pitch Capital" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cleanPath = pathname.replace(/^\/loan/, "");
  const isLoginRoute = cleanPath === "/admin/login" || cleanPath.startsWith("/admin/login/");
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const s = getSession();
    setAuthed(!!s);
    setChecked(true);

    if (!s && !isLoginRoute) {
      navigate({ to: "/admin/login", replace: true });
      return;
    }

    if (s && !isLoginRoute) {
      const role = getRole();
      const sharedPaths = ["/admin/profile", "/admin/application", "/admin/applications"];
      const isSharedPath = sharedPaths.some(
        (p) => cleanPath === p || cleanPath.startsWith(p + "/")
      );
      // Position Management is Administrator + Marketer only — Front Desk
      // and Operations & Disbursement don't get this one.
      const marketerExtraPaths = ["/admin/position-management"];
      const isMarketerExtra = marketerExtraPaths.some(
        (p) => cleanPath === p || cleanPath.startsWith(p + "/")
      );
      if (role === "Front Desk") {
        if (!isSharedPath) {
          navigate({ to: "/frontdesk", replace: true });
          return;
        }
      } else if (role === "Marketer") {
        if (!isSharedPath && !isMarketerExtra) {
          navigate({ to: "/marketer", replace: true });
          return;
        }
      } else if (role === "Operations & Disbursement") {
        if (!isSharedPath) {
          navigate({ to: "/operations", replace: true });
          return;
        }
      }
    }
  }, [navigate, isLoginRoute, cleanPath]);

  if (isLoginRoute) {
    return <><Outlet /><Toaster /></>;
  }

  if (!checked || !authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <DashboardLayout />;
}
