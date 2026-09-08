import { Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { logout, getDisplayIdentity, getRole } from "@/lib/admin-auth";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AdminNotification,
} from "@/lib/notifications";
import { getRememberedLoginUrl } from "@/components/admin/AdminLoginForm";

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
  if (!role) role = getDisplayIdentity().role;
  if (ADMIN_KNOWN_ROLES.includes(role)) {
    if (role === "Front Desk") return "/login/frontdesk";
    if (role === "Marketer") return "/login/marketer";
    if (role === "Operations & Disbursement") return "/login/operations";
    return "/admin/login";
  }
  return getLoginPathForRoleFuzzy(role || getRememberedLoginUrl());
}

export function DashboardLayout() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState({ email: "", name: "", role: "", initials: "A" });
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState(false);

  useEffect(() => {
    setIdentity(getDisplayIdentity());
  }, []);

  const handleLogout = async () => {
    const targetPath = resolveLogoutTargetSync();
    await logout();
    navigate({ to: targetPath, replace: true });
  };

  useEffect(() => {
    let cancelled = false;

    function load() {
      getNotifications()
        .then((items) => {
          if (!cancelled) {
            setNotifications(items);
            setNotifError(false);
          }
        })
        .catch(() => {
          if (!cancelled) setNotifError(true);
        })
        .finally(() => {
          if (!cancelled) setNotifLoading(false);
        });
    }

    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isUnreadNotif = (n: AdminNotification) => {
    const v: unknown = n.is_read;
    if (v === 0 || v === "0" || v === false || v === null || v === undefined) return true;
    if (v === 1 || v === "1" || v === true) return false;
    return !Boolean(v);
  };

  const unreadCount = notifications.filter(isUnreadNotif).length;
  const displayName = identity.name || "Admin";
  const displayRole = identity.role || "Administrator";

  const handleMarkRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    markNotificationRead(id).catch(() => {});
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    markAllNotificationsRead().catch(() => {});
  };

  return (
    <SidebarProvider>
      <div className="app-canvas flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-xl sm:px-6 print:hidden">
            <SidebarTrigger />

            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-2 py-2">
                    <DropdownMenuLabel className="py-0">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-medium text-primary hover:text-primary"
                        onClick={handleMarkAllRead}
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifLoading ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">Loading notifications...</div>
                  ) : notifError ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">Couldn't load notifications.</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">No new notifications</div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => {
                        const unread = isUnreadNotif(n);
                        const content = (
                          <div className="flex flex-col gap-0.5 py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium leading-snug">{n.title}</span>
                            </div>
                            {n.body && <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>}
                            <span className="text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        );
                        return (
                          <div
                            key={n.id}
                            className={`flex items-stretch gap-1 border-l-2 px-1 py-1 transition-colors ${
                              unread
                                ? "border-primary bg-primary/5"
                                : "border-transparent bg-transparent"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              {n.link_url ? (
                                <a
                                  href={n.link_url}
                                  className="block rounded px-2 py-1 hover:bg-muted"
                                >

                                  {content}
                                </a>
                              ) : (
                                <div className="px-2 py-1">{content}</div>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant={unread ? "default" : "ghost"}
                              size="icon"
                              className={`h-7 w-7 shrink-0 self-center ${
                                unread
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              disabled={!unread}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMarkRead(n.id);
                              }}
                              onSelect={(e) => e.preventDefault()}
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="h-9 w-9 ring-2 ring-primary/15">
                      <AvatarFallback className="brand-gradient text-primary-foreground text-xs font-bold">{identity.initials}</AvatarFallback>
                    </Avatar>

                    <div className="hidden text-left sm:block">
                      <div className="text-sm font-semibold leading-none">{displayName}</div>
                      <div className="text-xs text-muted-foreground">{displayRole}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <div className="font-semibold">{displayName}</div>
                    <div className="text-xs font-normal text-muted-foreground truncate">{identity.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-3 py-6 sm:px-6 lg:px-8 print:p-0">
            <Outlet />
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}