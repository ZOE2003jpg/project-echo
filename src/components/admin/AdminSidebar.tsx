import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FileText, BarChart3, User, LogOut, Inbox, Briefcase, Landmark, Archive } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { getRole, logout } from "@/lib/admin-auth";
import { getRememberedLoginUrl } from "@/components/admin/AdminLoginForm";
import logoUrl from "@/logo.jpg";

const PROFILE_LS_KEY = "pc_admin_profile";
const LOGIN_URL_REMEMBER_KEY = "pc_admin_last_login_url";
const ADMIN_KNOWN_ROLES = ["Administrator", "Front Desk", "Marketer", "Operations & Disbursement"];

const getLoginPathForRoleFuzzy = (role: string) => {
  if (!role) return "/admin/login";
  const r = role.toLowerCase().trim();
  if (r.includes("front")) return "/login/frontdesk";
  if (r.includes("market")) return "/login/marketer";
  if (r.includes("operation") || r.includes("disburs")) return "/login/operations";
  if (r.includes("admin")) return "/admin/login";
  return "/admin/login";
};

function resolveLogoutTargetSync(): string {
  try {
    const remembered = localStorage.getItem(LOGIN_URL_REMEMBER_KEY);
    if (remembered && remembered.startsWith("/")) return remembered;
  } catch { /* ignore */ }

  let role = "";
  try {
    const raw = localStorage.getItem(PROFILE_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      role = parsed?.role || "";
    }
  } catch { /* ignore */ }

  if (!role) role = getRole();
  if (ADMIN_KNOWN_ROLES.includes(role)) {
    if (role === "Front Desk") return "/login/frontdesk";
    if (role === "Marketer") return "/login/marketer";
    if (role === "Operations & Disbursement") return "/login/operations";
    return "/admin/login";
  }
  return getLoginPathForRoleFuzzy(role || getRememberedLoginUrl());
}

function readRoleFromStorageSync(): string {
  try {
    const raw = localStorage.getItem(PROFILE_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const r = parsed?.role || "";
      if (r && ADMIN_KNOWN_ROLES.includes(r)) return r;
    }
  } catch {
    /* ignore */
  }
  const helper = getRole();
  if (helper && ADMIN_KNOWN_ROLES.includes(helper)) return helper;
  return "";
}

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const role = readRoleFromStorageSync() || getRole();

  const handleLogout = async () => {
    const targetPath = resolveLogoutTargetSync();
    await logout();
    navigate({ to: targetPath, replace: true });
  };

  let items: { title: string; url: string; icon: any; exact?: boolean }[] = [
    { title: "Applications", url: "/admin/applications", icon: FileText },
    { title: "Profile", url: "/admin/profile", icon: User },
  ];

  if (role === "Administrator") {
    items = [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
      { title: "Applications", url: "/admin/applications", icon: FileText },
      { title: "Position Management", url: "/admin/position-management", icon: Archive },
      { title: "Reports", url: "/admin/reports", icon: BarChart3 },
      { title: "Profile", url: "/admin/profile", icon: User },
    ];
  } else if (role === "Front Desk") {
    items = [
      { title: "Front Desk Queue", url: "/frontdesk", icon: Inbox },
      { title: "Applications", url: "/admin/applications", icon: FileText },
      { title: "Profile", url: "/admin/profile", icon: User },
    ];
  } else if (role === "Marketer") {
    items = [
      { title: "Marketer Queue", url: "/marketer", icon: Briefcase },
      { title: "Applications", url: "/admin/applications", icon: FileText },
      { title: "Position Management", url: "/admin/position-management", icon: Archive },
      { title: "Profile", url: "/admin/profile", icon: User },
    ];
  } else if (role === "Operations & Disbursement") {
    items = [
      { title: "Operations & Disbursement", url: "/operations", icon: Landmark },
      { title: "Applications", url: "/admin/applications", icon: FileText },
      { title: "Profile", url: "/admin/profile", icon: User },
    ];
  }

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-5">
        <div className="flex items-center gap-3 px-1">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md ring-2 ring-gold/35 shadow-lift">
            <img src={logoUrl} alt="Pitch Capital Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-lg font-normal uppercase leading-none text-sidebar-foreground">Pitch Capital</div>
              <div className="mt-1 truncate text-[9px] font-extrabold uppercase text-gold">Admin Portal</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className="mb-2 text-[9px] font-extrabold uppercase text-sidebar-foreground/40">Workspace</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.exact)}
                    tooltip={item.title}
                    className="relative h-11 rounded-md text-sidebar-foreground/60 transition-all duration-150 hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-bold data-[active=true]:text-sidebar-foreground data-[active=true]:shadow-[inset_3px_0_0_var(--gold)]"
                  >

                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>

                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <button onClick={handleLogout} className="flex w-full items-center gap-3 text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground">
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Logout</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
