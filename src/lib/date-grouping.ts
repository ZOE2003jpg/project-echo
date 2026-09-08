import { type Application, type AppStatus } from "./applications";

// Buckets a date into "Today" / "Yesterday" / a formatted date, plus a
// sortable key — shared by every page that groups applications by day.
export function dateGroupKeyAndLabel(dateInput: string | number | Date): { key: string; label: string } {
  const date = new Date(dateInput);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const key = startOfDay.toISOString().slice(0, 10);
  let label: string;
  if (startOfDay.getTime() === startOfToday.getTime()) label = "Today";
  else if (startOfDay.getTime() === startOfYesterday.getTime()) label = "Yesterday";
  else label = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return { key, label };
}

// Statuses where "how long has this been sitting here" no longer matters —
// the application is done, one way or another.
const TERMINAL_STATUSES: AppStatus[] = ["Approved", "Rejected", "Completed"];

const STALE_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// How long an application has been sitting in its current state, using
// updated_at (which the database already bumps automatically whenever the
// row changes — including status changes) with submitted_at as a fallback
// for older records. Returns null for terminal statuses or when there's
// nothing stale enough to flag.
export function staleDaysIfAny(app: Application): number | null {
  if (TERMINAL_STATUSES.includes(app.status)) return null;

  const reference = app.updatedAt || app.updated_at || app.submittedAt || app.submitted_at;
  if (!reference) return null;

  const elapsed = Date.now() - +new Date(reference);
  if (elapsed < STALE_THRESHOLD_MS) return null;

  return Math.floor(elapsed / (24 * 60 * 60 * 1000));
}
