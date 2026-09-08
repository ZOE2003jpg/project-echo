import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, Eye, ExternalLink, AlertTriangle, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getAllApplications, formatNaira, type AppStatus, type Application } from "@/lib/applications";
import { staleDaysIfAny } from "@/lib/date-grouping";

const ASSET_BASE = "https://pitchcapital.ng/api/";
function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return ASSET_BASE + path.replace(/^\/+/, "");
}

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
  // exactly what was selected, per the requirement that filters persist.
  validateSearch: (search: Record<string, unknown>): ApplicationsSearch => ({
    date: typeof search.date === "string" ? search.date : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    product: typeof search.product === "string" ? search.product : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: ApplicationsPage,
});

// This page is for ACTIVE / in-progress applications only. Approved,
// Rejected, and Completed applications live on the Position Management page
// instead, and disappear from here automatically the moment their status
// changes.
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

  // Effective values — the URL is the source of truth; date defaults to
  // Today when nothing is present yet.
  const activeDate = search.date ?? todayStr();
  const activeStatus = (search.status as "All" | AppStatus | undefined) ?? "All";
  const activeProduct = search.product ?? "All";
  const activeQuery = search.q ?? "";

  // Pin the default date into the URL on first load, so the URL always
  // accurately reflects what's actually being shown — not a hidden default.
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
        // Drop default/empty values so the URL stays clean.
        if (!next.status || next.status === "All") delete next.status;
        if (!next.product || next.product === "All") delete next.product;
        if (!next.q) delete next.q;
        return next;
      },
      replace: true,
    });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllApplications();
        setAll(data);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Active (non-finalised) applications only — this is a hard filter,
  // independent of whatever status option happens to be selected.
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
    const q = activeQuery.trim().toLowerCase();
    const list = activeOnly
      .filter((a) => (activeStatus === "All" ? true : a.status === activeStatus))
      .filter((a) => (activeProduct === "All" ? true : (a.paypoint || "Unspecified") === activeProduct))
      .filter((a) =>
        q
          ? `${a.firstName || a.first_name} ${a.surname} ${a.id} ${a.email}`.toLowerCase().includes(q)
          : true,
      )
      .filter((a) => {
        if (!activeDate) return true;
        const submitted = new Date(a.submittedAt || a.submitted_at || 0);
        const y = submitted.getFullYear();
        const m = String(submitted.getMonth() + 1).padStart(2, "0");
        const d = String(submitted.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}` === activeDate;
      })
      .sort((a, b) => +new Date(a.submittedAt || a.submitted_at || 0) - +new Date(b.submittedAt || b.submitted_at || 0));
    return list;
  }, [activeOnly, activeStatus, activeProduct, activeQuery, activeDate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 px-6 py-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Applications</h1>
        <p className="text-sm text-muted-foreground">
          Active, in-progress applications. Approved, Rejected, and Completed applications move to Position Management.
        </p>
      </div>

      {/* Date selector — quick buttons + exact date picker, defaults to Today */}
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
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
          value={activeDate}
          onChange={(e) => setSearchParam({ date: e.target.value })}
          className="w-40"
        />
        {activeDate && (
          <Button size="sm" variant="ghost" onClick={() => setSearchParam({ date: undefined })}>
            Show all dates
          </Button>
        )}
      </div>

      {/* Product / Paypoint tabs */}
      <div className="overflow-x-auto pb-1">
        <Tabs value={activeProduct} onValueChange={(v) => setSearchParam({ product: v })}>
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            <TabsTrigger
              value="All"
              className="rounded-full border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All <Badge variant="secondary" className="ml-1.5">{activeOnly.length}</Badge>
            </TabsTrigger>
            {products.map(([name, count]) => (
              <TabsTrigger
                key={name}
                value={name}
                className="rounded-full border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {name} <Badge variant="secondary" className="ml-1.5">{count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div>
              <CardTitle>
                {activeProduct === "All" ? "Active applications" : `${activeProduct} applications`}
              </CardTitle>
              <CardDescription>{filteredList.length} result{filteredList.length === 1 ? "" : "s"}</CardDescription>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={activeQuery}
                onChange={(e) => setSearchParam({ q: e.target.value })}
                placeholder="Search by name, ID, email"
                className="pl-9 sm:w-64"
              />
            </div>
            <Select value={activeStatus} onValueChange={(v) => setSearchParam({ status: v })}>
              <SelectTrigger className="sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No active applications match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((a) => {
                    const staleDays = staleDaysIfAny(a);
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={resolveAssetUrl(a.passport)} alt={a.firstName || a.first_name || ""} />
                              <AvatarFallback>{(a.firstName || a.first_name || "")[0]}{a.surname[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <div className="truncate text-sm font-medium">{a.firstName || a.first_name} {a.surname}</div>
                                {staleDays !== null && (
                                  <Badge variant="destructive" className="text-[10px] shrink-0 flex items-center gap-1">
                                    <AlertTriangle className="h-2.5 w-2.5" /> {staleDays}d
                                  </Badge>
                                )}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">{a.id} • {a.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{a.paypoint || "—"}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{formatNaira(a.amountRequested || a.amount_requested)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(a.submittedAt || a.submitted_at || 0), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell><StatusBadge status={a.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to="/admin/application/$id" params={{ id: String(a.id) }}>
                              <Eye className="mr-1 h-3.5 w-3.5" /> View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Application Spreadsheet — untouched, same placement and behavior */}
      <div className="flex justify-center pt-2">
        <Button asChild variant="outline">
          <a
            href="https://docs.google.com/spreadsheets/d/1hokqx39P2DgWYME_uONzaTkEXkPEl3XMqGMzman8ZK8/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Open Application Spreadsheet
          </a>
        </Button>
      </div>
    </div>
  );
}
