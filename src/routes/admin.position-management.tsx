import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Eye, Archive, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchInput } from "@/components/admin/SearchInput";
import { getAllApplications, formatNaira, type AppStatus, type Application } from "@/lib/applications";
import { matchesApplicant } from "@/lib/search";
import { exportApprovedToExcel, filterApprovedByRange } from "@/lib/export-approved";


const ASSET_BASE = "https://pitchcapital.ng/api/";
function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return ASSET_BASE + path.replace(/^\/+/, "");
}

type PositionSearch = { tab?: string; q?: string };

export const Route = createFileRoute("/admin/position-management")({
  head: () => ({ meta: [{ title: "Position Management — Admin" }] }),
  validateSearch: (search: Record<string, unknown>): PositionSearch => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: PositionManagementPage,
});

const TABS: { value: AppStatus; label: string }[] = [
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Completed", label: "Completed" },
];

function finalizedDate(a: Application): string | number {
  return a.reviewedAt || a.reviewed_at || (a as any).completed_at || a.submittedAt || a.submitted_at || 0;
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PRESETS: { label: string; range: () => { from: string; to: string } }[] = [
  { label: "Today", range: () => ({ from: iso(new Date()), to: iso(new Date()) }) },
  {
    label: "This week",
    range: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return { from: iso(start), to: iso(now) };
    },
  },
  {
    label: "This month",
    range: () => {
      const now = new Date();
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
    },
  },
];

function PositionManagementPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [all, setAll] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const monthStart = PRESETS[2].range();
  const [fromDate, setFromDate] = useState(monthStart.from);
  const [toDate, setToDate] = useState(monthStart.to);

  const activeTab = (search.tab as AppStatus | undefined) ?? "Approved";
  const activeQuery = search.q ?? "";


  const setSearchParam = (patch: Partial<PositionSearch>) => {
    navigate({
      search: (prev) => {
        const next: PositionSearch = { ...prev, ...patch };
        if (!next.tab || next.tab === "Approved") delete next.tab;
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

  // Finalised applications only — the counterpart to the Applications page,
  // which shows everything EXCEPT these three statuses.
  const finalized = useMemo(
    () => all.filter((a) => a.status === "Approved" || a.status === "Rejected" || a.status === "Completed"),
    [all],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { Approved: 0, Rejected: 0, Completed: 0 };
    finalized.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [finalized]);

  const filteredList = useMemo(() => {
    return finalized
      .filter((a) => a.status === activeTab)
      .filter((a) => matchesApplicant(a, activeQuery))
      .sort((a, b) => +new Date(finalizedDate(b)) - +new Date(finalizedDate(a)));
  }, [finalized, activeTab, activeQuery]);

  // Approved applicants inside the chosen export date range.
  const exportable = useMemo(
    () => filterApprovedByRange(finalized, fromDate, toDate),
    [finalized, fromDate, toDate],
  );
  const exportCount = exportable.length;

  const handleExport = () => {
    if (exportCount === 0) {
      toast.error("No approved applicants in this date range.");
      return;
    }
    const written = exportApprovedToExcel(exportable, fromDate, toDate);
    toast.success(`Exported ${written} approved applicant${written === 1 ? "" : "s"}.`);
  };


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
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 px-6 py-4">
              {[1, 2, 3, 4].map((i) => (
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Position Management</h1>
        <p className="text-sm text-muted-foreground">
          Finalised applications — Approved, Rejected, and Completed. Archival and oversight only; decisions here are final.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setSearchParam({ tab: v })}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold leading-none">
                {counts[t.value] || 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "Approved" && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> Export approved applicants
            </CardTitle>
            <CardDescription>
              Name, loan amount, bank, account number and approved amount — as an Excel file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="export-from" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">From</Label>
                <Input id="export-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="sm:w-44" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="export-to" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">To</Label>
                <Input id="export-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="sm:w-44" />
              </div>
              <Button variant="brand" onClick={handleExport} disabled={exportCount === 0}>
                <Download className="mr-1 h-4 w-4" /> Export to Excel
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {exportCount === 0
                ? "No approved applicants in this date range."
                : `${exportCount} approved applicant${exportCount === 1 ? "" : "s"} will be exported.`}
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => { const r = p.range(); setFromDate(r.from); setToDate(r.to); }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}



      <Card>
        <CardHeader>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-primary" /> {activeTab} applications
              </CardTitle>
              <CardDescription>{filteredList.length} result{filteredList.length === 1 ? "" : "s"}</CardDescription>
            </div>
            <SearchInput
              value={activeQuery}
              onChange={(q) => setSearchParam({ q })}
              placeholder="Search by name, ID, email"
            />

          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No {activeTab.toLowerCase()} applications match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date {activeTab}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={resolveAssetUrl(a.passport)} alt={a.firstName || a.first_name || ""} />
                            <AvatarFallback>{(a.firstName || a.first_name || "")[0]}{a.surname[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{a.firstName || a.first_name} {a.surname}</div>
                            <div className="truncate text-xs text-muted-foreground">{a.id} • {a.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{a.paypoint || "—"}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{formatNaira(a.approvedAmount || a.approved_amount || a.amountRequested || a.amount_requested)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(finalizedDate(a)), "MMM d, yyyy")}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
