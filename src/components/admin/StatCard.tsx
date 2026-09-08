import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * A restrained metric tile: the number leads, the icon supports, nothing
 * competes with it.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "primary" | "warning" | "success" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  };
  return (
    <Card className="transition-shadow duration-200 hover:shadow-soft">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-1.5 truncate font-display text-[28px] font-bold leading-none tabular-nums text-foreground">
            {value}
          </div>
          {hint && <div className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
