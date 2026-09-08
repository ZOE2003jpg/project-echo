import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Eye, Archive, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchInput } from "@/components/admin/SearchInput";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ApplicantCell } from "@/components/admin/ApplicantCell";
import { EmptyState, ErrorState, ListPageSkeleton, NoResultsState } from "@/components/admin/StateBlocks";
import { getAllApplications, formatNaira, type AppStatus, type Application } from "@/lib/applications";
import { matchesApplicant } from "@/lib/search";
import { exportApprovedToExcel, filterApprovedByRange } from "@/lib/export-approved";

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
  const [failed, setFailed] = useState(false);
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

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setAll(await getAllApplications());
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Finalised applications only — the counterpart to the Applications page.
  const finalized = useMemo(
    () => all.filter((a) => a.status === "Approved" || a.status === "Rejected" || a.status === "Completed"),
    [all],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { Approved: 0, Rejected: 0, Completed: 0 };
    finalized.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [finalized]);

  // Search spans every finalised record on any date.
  const filteredList = useMemo(() => {
    return finalized
      .filter((a) => a.status === activeTab)
      .filter((a) => matchesApplicant(a, activeQuery))
      .sort((a, b) => +new Date(finalizedDate(b)) - +new Date(finalizedDate(a)));
  }, [finalized, activeTab, activeQuery]);

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

  const columns: Column<Application>[] = [
    {
      key: "applicant",
      header: "Applicant",
      primary: true,
      cell: (a) => <ApplicantCell application={a} secondary={`${a.id} • ${a.email}`} />,
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
          {formatNaira(a.approvedAmount || a.approved_amount || a.amountRequested || a.amount_requested)}
        </span>
      ),
    },
    {
      key: "date",
      header: `Date ${activeTab.toLowerCase()}`,
      cell: (a) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {format(new Date(finalizedDate(a)), "MMM d, yyyy")}
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

  if (loading) return <ListPageSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Position Management"
        description="Finalised applications — approved, rejected and completed. Archival and oversight only; decisions here are final."
      />

      <Tabs value={activeTab} onValueChange={(v) => setSearchParam({ tab: v })}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums">
                {counts[t.value] || 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "Approved" && (
        <Card>
          <CardHeader className="border-b border-border/60">
            <CardTitle className="section-title flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> Export approved applicants
            </CardTitle>
            <CardDescription>
              Name, loan amount, bank, account number and approved amount — as an Excel file.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="export-from" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  From
                </Label>
                <Input id="export-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-10 sm:w-44" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="export-to" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  To
                </Label>
                <Input id="export-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-10 sm:w-44" />
              </div>
              <Button variant="brand" onClick={handleExport} disabled={exportCount === 0}>
                <Download className="mr-1 h-4 w-4" /> Export to Excel
              </Button>
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
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">
              {exportCount === 0
                ? "No approved applicants in this date range."
                : `${exportCount} approved applicant${exportCount === 1 ? "" : "s"} will be exported.`}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <CardTitle className="section-title flex items-center gap-2 text-base">
                <Archive className="h-4 w-4 text-primary" /> {activeTab} applications
              </CardTitle>
              <CardDescription className="tabular-nums">
                {filteredList.length} result{filteredList.length === 1 ? "" : "s"}
                {activeQuery ? " — searching all dates" : ""}
              </CardDescription>
            </div>
            <SearchInput value={activeQuery} onChange={(q) => setSearchParam({ q })} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {failed ? (
            <ErrorState onRetry={load} />
          ) : filteredList.length === 0 ? (
            activeQuery ? (
              <NoResultsState query={activeQuery} onClear={() => setSearchParam({ q: undefined })} />
            ) : (
              <EmptyState
                title={`No ${activeTab.toLowerCase()} applications`}
                body="Applications appear here once they reach this final stage."
              />
            )
          ) : (
            <DataTable
              columns={columns}
              rows={filteredList}
              getRowKey={(a) => String(a.id)}
              caption={`${activeTab} applications`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
