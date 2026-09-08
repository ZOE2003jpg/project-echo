import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  };
  return (
    <Card className="group relative overflow-hidden hover:shadow-lift">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 brand-gradient opacity-70" />
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ring-current/10 transition-transform duration-200 group-hover:scale-105",
            tones[tone],
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 truncate font-display text-2xl font-bold text-foreground">{value}</div>
          {hint && <div className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

