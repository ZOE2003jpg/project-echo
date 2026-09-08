import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Eye, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchInput } from "@/components/admin/SearchInput";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ApplicantCell } from "@/components/admin/ApplicantCell";
import { EmptyState, ErrorState, ListPageSkeleton, NoResultsState } from "@/components/admin/StateBlocks";
import { getAllApplications, formatNaira, type Application } from "@/lib/applications";
import { matchesApplicant } from "@/lib/search";

export const Route = createFileRoute("/_dashboard/frontdesk")({
  head: () => ({ meta: [{ title: "Front Desk Queue — Admin" }] }),
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: FrontDeskPage,
});

function FrontDeskPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = search.q ?? "";
  const setQuery = (q: string) =>
    navigate({ search: (prev) => (q ? { ...prev, q } : { ...prev, q: undefined }), replace: true });

  const [all, setAll] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<"pending" | "history">("pending");

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

  const pending = all.filter((a) => a.status === "Awaiting Front Desk");
  const history = all.filter((a) => a.status === "Completed");
  // Search always spans the whole record set for this queue, not one day.
  const apps = (tab === "pending" ? pending : history).filter((a) => matchesApplicant(a, query));

  const columns: Column<Application>[] = [
    {
      key: "applicant",
      header: "Applicant",
      primary: true,
      cell: (a) => <ApplicantCell application={a} showStale />,
    },
    {
      key: "product",
      header: "Product",
      cell: (a) => <span className="whitespace-nowrap text-sm text-muted-foreground">{a.paypoint || "—"}</span>,
    },
    {
      key: "requested",
      header: "Requested",
      align: "right",
      numeric: true,
      cell: (a) => <span className="text-sm font-semibold">{formatNaira(a.amountRequested || a.amount_requested)}</span>,
    },
    {
      key: "approved",
      header: "Approved",
      align: "right",
      numeric: true,
      cell: (a) => (
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {formatNaira(a.approvedAmount || a.approved_amount)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (a) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {format(new Date(a.submittedAt || a.submitted_at || 0), "MMM d, yyyy")}
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
        title="Front Desk Queue"
        description="Applications awaiting Front Desk contact, plus everything already completed."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "history")}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground tabular-nums">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="border-b border-border/60">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <CardTitle className="section-title flex items-center gap-2 text-base">
                <Inbox className="h-4 w-4 text-primary" />
                {tab === "pending" ? "Assigned applications" : "Completed applications"}
              </CardTitle>
              <CardDescription className="tabular-nums">
                {apps.length} application{apps.length !== 1 ? "s" : ""} {tab === "pending" ? "in queue" : "completed"}
                {query ? " — searching all dates" : ""}
              </CardDescription>
            </div>
            <SearchInput value={query} onChange={setQuery} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {failed ? (
            <ErrorState onRetry={load} />
          ) : apps.length === 0 ? (
            query ? (
              <NoResultsState query={query} onClear={() => setQuery("")} />
            ) : (
              <EmptyState
                title={tab === "pending" ? "Queue is clear" : "No completed applications yet"}
                body={
                  tab === "pending"
                    ? "Nothing is waiting on the Front Desk right now. New applications appear here as soon as they reach this stage."
                    : "Completed applications will be listed here once they finish the process."
                }
              />
            )
          ) : (
            <DataTable columns={columns} rows={apps} getRowKey={(a) => String(a.id)} caption="Front desk queue" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
