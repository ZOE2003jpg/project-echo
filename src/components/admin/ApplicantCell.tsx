import { AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Application } from "@/lib/applications";
import { staleDaysIfAny } from "@/lib/date-grouping";

const ASSET_BASE = "https://pitchcapital.ng/api/";

export function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return ASSET_BASE + path.replace(/^\/+/, "");
}

export function applicantName(a: Application): string {
  return `${(a as any).firstName || (a as any).first_name || ""} ${a.surname || ""}`.trim();
}

/** The identity column shared by every applicant list. */
export function ApplicantCell({
  application: a,
  secondary,
  showStale = false,
}: {
  application: Application;
  /** Extra line under the name. Defaults to the application ID. */
  secondary?: string;
  showStale?: boolean;
}) {
  const first = ((a as any).firstName || (a as any).first_name || "") as string;
  const staleDays = showStale ? staleDaysIfAny(a) : null;

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
        <AvatarImage src={resolveAssetUrl(a.passport)} alt="" />
        <AvatarFallback className="text-xs font-semibold">
          {(first[0] || "").toUpperCase()}
          {(a.surname?.[0] || "").toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground">{applicantName(a) || "—"}</span>
          {staleDays !== null && (
            <Badge variant="destructive" className="flex shrink-0 items-center gap-1 text-[10px]">
              <AlertTriangle className="h-2.5 w-2.5" /> {staleDays}d
            </Badge>
          )}
        </div>
        <div className="truncate text-xs text-muted-foreground">{secondary ?? String(a.id)}</div>
      </div>
    </div>
  );
}

/** Customer response pill — themed, not hardcoded colours. */
export function ResponsePill({ value }: { value?: string | null }) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>;
  const tone =
    value === "Accepted"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : value === "Rejected"
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : "border-border bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>
      {value}
    </span>
  );
}
