import { apiRequest } from "./api-client";

export type AdminSession = {
  email: string;
  loggedInAt: number;
};

export type AdminProfile = {
  name: string;
  phone: string;
  role: string;
  email?: string;
};

const SESSION_TOKEN_KEY = "pc_admin_session_token";
const SESSION_KEY = "pc_admin_session";
const PROFILE_KEY = "pc_admin_profile";

function deriveInitials(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.replace(/@.*/, "").split(/[.\s_-]+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Login function that uses real API
export async function login(email: string, password: string): Promise<{ token: string; admin: AdminProfile }> {
  const result = await apiRequest<{ token: string; admin: AdminProfile }>("/admin/login.php", {
    method: "POST",
    body: { email, password },
  });
  
  // Save the token and profile
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_TOKEN_KEY, result.token);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(result.admin));
    const session: AdminSession = { email: result.admin.email || email, loggedInAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  
  return result;
}

export async function logout(): Promise<void> {
  try {
    // Call logout API
    await apiRequest("/admin/logout.php", { method: "POST" });
  } catch {
    // Ignore errors for logout
  } finally {
    // Clear local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(PROFILE_KEY);
    }
  }
}

export async function fetchProfile(): Promise<AdminProfile> {
  const result = await apiRequest<AdminProfile>("/admin/me.php");
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(result));
  }
  return result;
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SESSION_TOKEN_KEY) !== null;
}

export function getProfile(): AdminProfile {
  if (typeof window === "undefined") return { name: "", phone: "", role: "" };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { name: "", phone: "", role: "", ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { name: "", phone: "", role: "" };
}

export async function saveProfile(profile: AdminProfile): Promise<AdminProfile> {
  const result = await apiRequest<AdminProfile>("/admin/me.php", {
    method: "PUT",
    body: profile,
  });
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(result));
  }
  return result;
}

export function getRole(): string {
  const profile = getProfile();
  return profile.role || "";
}

export function getDisplayIdentity() {
  const session = getSession();
  const profile = getProfile();
  const email = session?.email ?? "";
  const name = profile.name || "";
  const role = profile.role || "";
  return {
    email,
    name,
    role,
    initials: deriveInitials(name, email),
  };
}
