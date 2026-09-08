import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Eye, ExternalLink, CalendarDays, Globe, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchInput } from "@/components/admin/SearchInput";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ApplicantCell } from "@/components/admin/ApplicantCell";
import { EmptyState, ErrorState, ListPageSkeleton, NoResultsState } from "@/components/admin/StateBlocks";
import { getAllApplications, formatNaira, type AppStatus, type Application } from "@/lib/applications";
import { matchesApplicant } from "@/lib/search";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function submittedDayKey(a: Application): string {
  const d = new Date(a.submittedAt || a.submitted_at || 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type ApplicationsSearch = {
  date?: string;
  status?: string;
  product?: string;
  q?: string;
};

export const Route = createFileRoute("/admin/applications")({
  head: () => ({ meta: [{ title: "Applications — Admin" }] }),
  // Every filter on this page lives in the URL, not local component state —
  // so navigating away and back (or sharing/bookmarking the URL) restores
  // exactly what was selected.
  validateSearch: (search: Record<string, unknown>): ApplicationsSearch => ({
    date: typeof search.date === "string" ? search.date : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    product: typeof search.product === "string" ? search.product : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: ApplicationsPage,
});

// This page is for ACTIVE / in-progress applications only. Approved,
// Rejected and Completed applications live on Position Management.
const ACTIVE_STATUSES: AppStatus[] = [
  "Pending", "Under Review", "Awaiting Front Desk", "Awaiting Marketer",
  "Back To Admin", "Awaiting Operations & Disbursement",
];

const FILTERS: ("All" | AppStatus)[] = ["All", ...ACTIVE_STATUSES];

const PAYPOINTS = [
  "NPF", "NSCDC", "OYRTMA", "OYSHMB", "OYO TESCOM", "OYO SUBEB", "OYO PRY HEALTH",
  "OYO MIN EDU", "OXSROMA", "OYSREB", "EOSTAB", "UI", "KWA COLL", "KWA SUB",
  "KWARTMA", "KWA TES", "KWA MIN", "KWA WATER CORP", "OSUN", "UNIMED", "OGUN SUBEB", "NON PAYROLL", "ONDO",
];

function ApplicationsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [all, setAll] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const activeDate = search.date ?? todayStr();
  const activeStatus = (search.status as "All" | AppStatus | undefined) ?? "All";
  const activeProduct = search.product ?? "All";
  const activeQuery = search.q ?? "";
  // A search is a request to find a person — not to browse a day. So the
  // moment someone types, we look through every record we have.
  const isSearching = activeQuery.trim().length > 0;

  useEffect(() => {
    if (!search.date) {
      navigate({ search: (prev) => ({ ...prev, date: todayStr() }), replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSearchParam = (patch: Partial<ApplicationsSearch>) => {
    navigate({
      search: (prev) => {
        const next: ApplicationsSearch = { ...prev, ...patch };
        if (!next.status || next.status === "All") delete next.status;
        if (!next.product || next.product === "All") delete next.product;
        if (!next.q) delete next.q;
        return next;
      },
      replace: true,
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await getAllApplications();
      setAll(data);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeOnly = useMemo(
    () => all.filter((a) => ACTIVE_STATUSES.includes(a.status)),
    [all],
  );

  const products = useMemo(() => {
    const counts = new Map<string, number>();
    activeOnly.forEach((a) => {
      const p = a.paypoint || "Unspecified";
      counts.set(p, (counts.get(p) || 0) + 1);
    });
    const fixed: [string, number][] = PAYPOINTS.map((name) => [name, counts.get(name) || 0]);
    const extras: [string, number][] = Array.from(counts.entries())
      .filter(([name]) => !PAYPOINTS.includes(name))
      .sort((a, b) => b[1] - a[1]);
    return [...fixed, ...extras];
  }, [activeOnly]);

  const filteredList = useMemo(() => {
    const list = activeOnly
      .filter((a) => (activeStatus === "All" ? true : a.status === activeStatus))
      .filter((a) => (activeProduct === "All" ? true : (a.paypoint || "Unspecified") === activeProduct))
      .filter((a) => matchesApplicant(a, activeQuery))
      // Date only narrows the browse view. While searching, every date is in scope.
      .filter((a) => (isSearching || !activeDate ? true : submittedDayKey(a) === activeDate));

    return list.sort((a, b) => {
      const at = +new Date(a.submittedAt || a.submitted_at || 0);
      const bt = +new Date(b.submittedAt || b.submitted_at || 0);
      // Search results read best newest-first; a single day reads best in order.
      return isSearching ? bt - at : at - bt;
    });
  }, [activeOnly, activeStatus, activeProduct, activeQuery, activeDate, isSearching]);

  const filtersApplied = isSearching || activeStatus !== "All" || activeProduct !== "All";
  const clearAll = () => setSearchParam({ q: undefined, status: undefined, product: undefined });

  const columns: Column<Application>[] = [
    {
      key: "applicant",
      header: "Applicant",
      primary: true,
      cell: (a) => <ApplicantCell application={a} secondary={`${a.id} • ${a.email}`} showStale />,
    },
    {
      key: "product",
      header: "Product",
      cell: (a) => <span className="whitespace-nowrap text-sm text-muted-foreground">{a.paypoint || "—"}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      numeric: true,
      cell: (a) => (
        <span className="whitespace-nowrap text-sm font-semibold">
          {formatNaira(a.amountRequested || a.amount_requested)}
        </span>
      ),
    },
    {
      key: "time",
      header: isSearching ? "Applied" : "Time",
      cell: (a) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {format(new Date(a.submittedAt || a.submitted_at || 0), isSearching ? "MMM d, yyyy" : "MMM d, h:mm a")}
        </span>
      ),
    },
    { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
    {
      key: "action",
      header: "Action",
      align: "right",
      action: true,
      cell: (a) => (
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/application/$id" params={{ id: String(a.id) }}>
            <Eye className="mr-1 h-3.5 w-3.5" /> View
          </Link>
        </Button>
      ),
    },
  ];

  if (loading) return <ListPageSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Active, in-progress applications. Approved, rejected and completed applications move to Position Management."
        actions={
          <Button asChild variant="outline" size="sm">
            <a
              href="https://docs.google.com/spreadsheets/d/1hokqx39P2DgWYME_uONzaTkEXkPEl3XMqGMzman8ZK8/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Application spreadsheet
            </a>
          </Button>
        }
      />

      {/* Search first — it always spans every record and every date. */}
      <div className="panel space-y-4 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="applicant-search" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Find an applicant
            </Label>
            <SearchInput
              value={activeQuery}
              onChange={(q) => setSearchParam({ q })}
              className="w-full sm:max-w-md"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={activeStatus} onValueChange={(v) => setSearchParam({ status: v })}>
              <SelectTrigger className="h-10 lg:w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isSearching ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
            <Globe className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-foreground">
              Searching <span className="font-semibold">all dates</span> —{" "}
              {filteredList.length} match{filteredList.length === 1 ? "" : "es"} across every application on record.
            </p>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSearchParam({ q: undefined })}>
              Back to day view
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Day</span>
            <Button
              size="sm"
              variant={activeDate === todayStr() ? "default" : "outline"}
              onClick={() => setSearchParam({ date: todayStr() })}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={activeDate === yesterdayStr() ? "default" : "outline"}
              onClick={() => setSearchParam({ date: yesterdayStr() })}
            >
              Yesterday
            </Button>
            <Input
              type="date"
              aria-label="Show applications from a specific date"
              value={activeDate}
              onChange={(e) => setSearchParam({ date: e.target.value })}
              className="h-9 w-40"
            />
            {activeDate && (
              <Button size="sm" variant="ghost" onClick={() => setSearchParam({ date: undefined })}>
                Show all dates
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Product / Paypoint filter */}
      <div className="overflow-x-auto pb-1">
        <Tabs value={activeProduct} onValueChange={(v) => setSearchParam({ product: v })}>
          <TabsList className="h-auto flex-wrap justify-start gap-1.5 bg-transparent p-0">
            <TabsTrigger
              value="All"
              className="rounded-full border border-border px-3 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All <Badge variant="secondary" className="ml-1.5 tabular-nums">{activeOnly.length}</Badge>
            </TabsTrigger>
            {products.map(([name, count]) => (
              <TabsTrigger
                key={name}
                value={name}
                className="rounded-full border border-border px-3 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {name} <Badge variant="secondary" className="ml-1.5 tabular-nums">{count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader className="border-b border-border/60">
          <CardTitle className="section-title text-base">
            {isSearching
              ? "Search results"
              : activeProduct === "All"
                ? "Active applications"
                : `${activeProduct} applications`}
          </CardTitle>
          <CardDescription className="tabular-nums">
            {filteredList.length} result{filteredList.length === 1 ? "" : "s"}
            {!isSearching && activeDate ? ` for ${format(new Date(`${activeDate}T00:00:00`), "d MMM yyyy")}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {failed ? (
            <ErrorState onRetry={load} />
          ) : filteredList.length === 0 ? (
            filtersApplied ? (
              <NoResultsState query={activeQuery || undefined} onClear={clearAll} />
            ) : (
              <EmptyState
                title="Nothing in this day's queue"
                body="No active applications were submitted on the selected date. Pick another day, or search by name to look across every date."
              />
            )
          ) : (
            <DataTable
              columns={columns}
              rows={filteredList}
              getRowKey={(a) => String(a.id)}
              caption="Active applications"
            />
          )}
        </CardContent>
      </Card>

      {loading && (
        <div className="flex justify-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  );
}
