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
    primary: "bg-primary text-primary-foreground",
    warning: "bg-accent/25 text-accent-foreground",
    success: "bg-success/10 text-success",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };
  return (
    <Card className="group metric-enter overflow-hidden border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lift">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-extrabold uppercase text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 truncate font-display text-4xl font-normal leading-none tabular-nums text-primary">
            {value}
          </div>
          {hint && <div className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md transition-transform duration-200 group-hover:rotate-3 group-hover:scale-105", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
