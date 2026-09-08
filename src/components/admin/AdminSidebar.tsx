import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FileText, BarChart3, User, LogOut, Building2, Inbox, Briefcase, Landmark, Archive } from "lucide-react";
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
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl brand-gradient text-primary-foreground shadow-soft">
            <img src={logoUrl} alt="Pitch Capital Logo" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-bold tracking-tight">Pitch Capital</div>
              <div className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">Admin Console</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest">Manage</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.exact)}
                    tooltip={item.title}
                    className="rounded-lg font-medium transition-colors data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary"
                  >
                    <Link to={item.url} className="flex items-center gap-2.5">
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
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <button onClick={handleLogout} className="flex items-center gap-2 text-destructive w-full text-left">
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
