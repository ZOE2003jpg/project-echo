import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { FileText, Clock, CheckCircle2, XCircle, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ApplicantCell } from "@/components/admin/ApplicantCell";
import { EmptyState } from "@/components/admin/StateBlocks";
import { getAllApplications, formatNaira, type Application } from "@/lib/applications";


export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getAllApplications();
        setApps(data);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const total = apps.length;
  const pending = apps.filter((a) => a.status === "Pending").length;
  const review = apps.filter((a) => a.status === "Under Review").length;
  const approved = apps.filter((a) => a.status === "Approved").length;
  const rejected = apps.filter((a) => a.status === "Rejected").length;
  const totalApprovedAmount = apps
    .filter((a) => a.status === "Approved")
    .reduce((s, a) => s + (a.approvedAmount ?? a.amountRequested ?? 0), 0);
  const approvalRate = total ? Math.round((approved / total) * 100) : 0;

  const recent = [...apps]
    .sort((a, b) => +new Date(b.submittedAt || b.submitted_at || 0) - +new Date(a.submittedAt || a.submitted_at || 0))
    .slice(0, 6);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const recentColumns: Column<Application>[] = [
    { key: "applicant", header: "Applicant", primary: true, cell: (a) => <ApplicantCell application={a} /> },
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
      key: "date",
      header: "Date",
      cell: (a) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {format(new Date(a.submittedAt || a.submitted_at || 0), "MMM d, yyyy")}
        </span>
      ),
    },
    { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of loan applications and activity." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applications" value={total} icon={FileText} tone="primary" hint="All time" />
        <StatCard label="Pending" value={pending} icon={Clock} tone="warning" hint="Awaiting review" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} tone="success" hint={formatNaira(totalApprovedAmount)} />
        <StatCard label="Rejected" value={rejected} icon={XCircle} tone="danger" hint={`${total - approved - rejected} in progress`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 border-b border-border/60">
            <div>
              <CardTitle className="section-title text-base">Recent applications</CardTitle>
              <CardDescription>Latest 6 applications submitted</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/applications">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <EmptyState
                title="No applications yet"
                body="Submitted loan applications will appear here as soon as the first one arrives."
              />
            ) : (
              <DataTable
                columns={recentColumns}
                rows={recent}
                getRowKey={(a) => String(a.id)}
                caption="Recent applications"
              />
            )}
          </CardContent>
        </Card>


        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Approval rate</span>
                  <span className="font-semibold">{approvalRate}%</span>
                </div>
                <Progress value={approvalRate} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Under review</span>
                  <span className="font-semibold">{review}</span>
                </div>
                <Progress value={total ? (review / total) * 100 : 0} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-semibold">{pending}</span>
                </div>
                <Progress value={total ? (pending / total) * 100 : 0} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">Unique applicants</div>
                  <div className="text-xs text-muted-foreground">{total} this period</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">Total disbursed</div>
                  <div className="text-xs text-muted-foreground">{formatNaira(totalApprovedAmount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
