import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type Column<T> = {
  /** Stable key for React. */
  key: string;
  /** Column heading. Also used as the field label in the mobile card layout. */
  header: string;
  cell: (row: T) => ReactNode;
  /** Right-align (money) or keep left. */
  align?: "left" | "right";
  /** Numbers align better with tabular figures. */
  numeric?: boolean;
  /** The identity column — rendered as the card heading on small screens. */
  primary?: boolean;
  /** The row action — rendered in the card footer on small screens. */
  action?: boolean;
  className?: string;
};

/**
 * The single table pattern used by every staff list. Desktop gets a real
 * table with a quiet, sticky-feeling header; below `md` each row becomes a
 * readable stacked card instead of a sideways scroll.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  caption?: string;
}) {
  const primary = columns.find((c) => c.primary);
  const action = columns.find((c) => c.action);
  const rest = columns.filter((c) => !c.primary && !c.action);

  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          {caption && <caption className="sr-only">{caption}</caption>}
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/55 hover:bg-muted/55">
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  scope="col"
                  className={cn(
                    "h-12 text-[10px] font-extrabold uppercase text-muted-foreground",
                    c.align === "right" && "text-right",
                    c.className,
                  )}
                >
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={getRowKey(row)} style={{ animationDelay: `${Math.min(index, 10) * 28}ms` }} className="table-row-enter border-b border-border/55 transition-all duration-150 hover:bg-accent/10">
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    className={cn(
                      "py-4 align-middle",
                      c.align === "right" && "text-right",
                      c.numeric && "tabular-nums",
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: one card per record */}
      <ul className="divide-y divide-border/60 md:hidden">
        {rows.map((row) => (
          <li key={getRowKey(row)} className="table-row-enter space-y-3 px-4 py-5">
            {primary && <div>{primary.cell(row)}</div>}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {rest.map((c) => (
                <div key={c.key} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.header}
                  </dt>
                  <dd className={cn("truncate text-sm", c.numeric && "tabular-nums")}>{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
            {action && <div className="pt-1 [&_a]:w-full [&_button]:w-full">{action.cell(row)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}
