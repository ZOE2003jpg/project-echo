import { format } from "date-fns";
import { Check, Clock, FileText, Eye, XCircle } from "lucide-react";
import type { TimelineEvent } from "@/lib/applications";
import { cn } from "@/lib/utils";

function iconFor(label: string) {
  const l = label.toLowerCase();
  if (l.includes("approv")) return Check;
  if (l.includes("reject")) return XCircle;
  if (l.includes("review")) return Clock;
  if (l.includes("view")) return Eye;
  return FileText;
}

function toneFor(label: string) {
  const l = label.toLowerCase();
  if (l.includes("approv")) return "bg-emerald-500 text-white";
  if (l.includes("reject")) return "bg-rose-500 text-white";
  if (l.includes("review")) return "bg-blue-500 text-white";
  return "bg-primary text-primary-foreground";
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {events.map((e, i) => {
        const Icon = iconFor(e.label);
        return (
          <li key={i} className="relative">
            <span
              className={cn(
                "absolute -left-[34px] grid h-7 w-7 place-items-center rounded-full ring-4 ring-background",
                toneFor(e.label),
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-foreground">{e.label}</div>
              <div className="text-xs text-muted-foreground">{format(new Date(e.at || 0), "PPP p")}</div>
              {e.note && <div className="mt-1 text-sm text-muted-foreground">{e.note}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
