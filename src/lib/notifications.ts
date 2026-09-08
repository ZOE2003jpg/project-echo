import { apiRequest } from "./api-client";

export type AdminNotification = {
  id: number;
  admin_id: number | null;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: number;
  created_at: string;
};

function isUnread(n: Record<string, unknown>): boolean {
  const raw = n.is_read ?? n.isRead ?? n.read ?? 0;
  if (raw === true) return false;
  if (raw === false) return true;
  if (raw === 1 || raw === "1") return false;
  if (raw === 0 || raw === "0" || raw === null || raw === undefined) return true;
  return !Boolean(raw);
}

function normalizeNotification(raw: Record<string, unknown>): AdminNotification {
  return {
    id: Number(raw.id ?? 0),
    admin_id: raw.admin_id != null ? Number(raw.admin_id) : raw.adminId != null ? Number(raw.adminId) : null,
    title: String(raw.title ?? ""),
    body: raw.body != null ? String(raw.body) : null,
    link_url: raw.link_url != null ? String(raw.link_url) : raw.linkUrl != null ? String(raw.linkUrl) : null,
    is_read: isUnread(raw) ? 0 : 1,
    created_at: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
  };
}

export async function getNotifications(): Promise<AdminNotification[]> {
  try {
    const result = await apiRequest<unknown>("/admin/notifications.php");
    if (!Array.isArray(result)) return [];
    return result.map((item) => normalizeNotification(item as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function markNotificationRead(id: number): Promise<boolean> {
  try {
    await apiRequest<unknown>("/admin/notifications.php", {
      method: "POST",
      body: JSON.stringify({ action: "mark_read", id }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    await apiRequest<unknown>("/admin/notifications.php", {
      method: "POST",
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    return true;
  } catch {
    return false;
  }
}
