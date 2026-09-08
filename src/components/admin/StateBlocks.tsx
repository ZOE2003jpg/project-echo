import type { ReactNode } from "react";
import { AlertCircle, Inbox, RotateCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Shell({
  icon,
  title,
  body,
  action,
  tone = "muted",
}: {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  tone?: "muted" | "danger";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div
        className={cn(
          "grid h-11 w-11 place-items-center rounded-full",
          tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {body && <p className="mx-auto max-w-md text-sm text-muted-foreground">{body}</p>}
      </div>
      {action}
    </div>
  );
}

/** Nothing here yet — explains why and, where possible, what to do next. */
export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return <Shell icon={icon ?? <Inbox className="h-5 w-5" />} title={title} body={body} action={action} />;
}

/** Filters or a search term matched nothing — always offers a way back. */
export function NoResultsState({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <Shell
      icon={<SearchX className="h-5 w-5" />}
      title={query ? `No match for “${query}”` : "No results"}
      body={
        query
          ? "We searched every application record. Check the spelling, or try just the surname or the application ID."
          : "No records match the filters you've applied."
      }
      action={
        onClear ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear search and filters
          </Button>
        ) : undefined
      }
    />
  );
}

/** Something went wrong: what happened, why, and what to do next. */
export function ErrorState({
  title = "We couldn't load applications",
  body = "The application service didn't respond. This is usually a temporary network problem — your data is safe.",
  onRetry,
}: {
  title?: string;
  body?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <Shell
      tone="danger"
      icon={<AlertCircle className="h-5 w-5" />}
      title={title}
      body={body}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Try again
          </Button>
        ) : undefined
      }
    />
  );
}

/** Consistent loading skeleton for a page built around one list. */
export function ListPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-72" />
      <div className="panel divide-y divide-border/60">
        <div className="space-y-2 p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-3 p-5">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
