import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { login, isAuthenticated, getProfile, logout } from "@/lib/admin-auth";
import logoUrl from "@/logo.jpg";

export type RoleType = "Administrator" | "Front Desk" | "Marketer" | "Operations & Disbursement";

const LOGIN_URL_REMEMBER_KEY = "pc_admin_last_login_url";

export function getRememberedLoginUrl(): string {
  if (typeof window === "undefined") return "/admin/login";
  try {
    const v = localStorage.getItem(LOGIN_URL_REMEMBER_KEY);
    if (v) return v;
  } catch { /* ignore */ }
  return "/admin/login";
}

function rememberLoginUrlForRole(role: string) {
  if (typeof window === "undefined") return;
  let url = "/admin/login";
  if (role === "Front Desk") url = "/login/frontdesk";
  else if (role === "Marketer") url = "/login/marketer";
  else if (role === "Operations & Disbursement") url = "/login/operations";
  try { localStorage.setItem(LOGIN_URL_REMEMBER_KEY, url); } catch { /* ignore */ }
}

interface AdminLoginFormProps {
  expectedRole: RoleType;
}

export function AdminLoginForm({ expectedRole }: AdminLoginFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDashboardPath = (role: string) => {
    if (role === "Front Desk") return "/frontdesk";
    if (role === "Marketer") return "/marketer";
    if (role === "Operations & Disbursement") return "/operations";
    return "/admin";
  };

  const getLoginPath = (role: string) => {
    if (role === "Front Desk") return "/login/frontdesk";
    if (role === "Marketer") return "/login/marketer";
    if (role === "Operations & Disbursement") return "/login/operations";
    return "/admin/login";
  };

  const getErrorMessage = (loggedInRole: string) => {
    const correctPath = getLoginPath(loggedInRole);
    if (expectedRole === "Administrator") {
      return `This login page is for Administrators only. Please use your role's login link: ${correctPath}`;
    }
    return `This login page is for ${expectedRole} only. Please use the correct login link for your role: ${correctPath}`;
  };

  useEffect(() => {
    if (isAuthenticated()) {
      const role = getProfile().role;
      if (role === expectedRole) {
        navigate({ to: getDashboardPath(role), replace: true });
      } else {
        // Show error and log out because authenticated under different role
        toast.error(getErrorMessage(role));
        logout();
      }
    }
  }, [navigate, expectedRole]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result) {
        const role = result.admin?.role;
        if (role === expectedRole) {
          rememberLoginUrlForRole(role);
          toast.success("Welcome back");
          navigate({ to: getDashboardPath(role), replace: true });
        } else {
          // Immediately log out to clear the session
          await logout();
          toast.error(getErrorMessage(role));
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  const headingTitle = expectedRole === "Administrator" ? "Pitch Capital Admin" : `Pitch Capital ${expectedRole}`;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-14 w-14 rounded-full overflow-hidden bg-primary text-primary-foreground flex items-center justify-center shadow-lg mb-3 border border-border/50">
            <img src={logoUrl} alt="Pitch Capital Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{headingTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage loan applications</p>
        </div>

        <Card className="border-border/60 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@pitchcapital.ng"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm text-muted-foreground">
                  Remember me for 30 days
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground hover:underline">← Back to website</Link>
        </p>
      </div>
      <Toaster />
    </div>
  );
}
