import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One page-title treatment for every staff screen: title, one supporting
 * line, and an optional slot for page-level actions.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("page-enter flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-accent-foreground">
          <span className="h-px w-7 bg-gold" aria-hidden="true" /> Staff workspace
        </div>
        <h1 className="font-display text-3xl font-normal uppercase leading-none text-primary sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
