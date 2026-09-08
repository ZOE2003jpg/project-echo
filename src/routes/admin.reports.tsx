import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Clock, CheckCircle2, XCircle, TrendingUp, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/admin/StatCard";
import { getStats, formatNaira, type StatsData } from "@/lib/applications";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load stats:", error);
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1,2].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const maxMonth = Math.max(1, ...stats.months.map((m) => m.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reports</h1>
        <p className="text-sm text-muted-foreground">Performance metrics for loan applications.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={FileText} tone="primary" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="warning" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="danger" />
        <StatCard label="Approval rate" value={`${stats.approvalRate}%`} icon={Percent} tone="success" />
        <StatCard label="Rejection rate" value={`${stats.rejectionRate}%`} icon={Percent} tone="danger" />
        <StatCard label="Under review" value={stats.underReview} icon={Clock} tone="info" />
        <StatCard label="Total approved (₦)" value={formatNaira(stats.totalApprovedAmount)} icon={TrendingUp} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Applications by month</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end justify-between gap-3">
              {stats.months.map(({ month, count }) => (
                <div key={month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="text-xs font-semibold text-foreground">{count}</div>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60"
                    style={{ height: `${(count / maxMonth) * 100}%`, minHeight: 4 }}
                  />
                  <div className="text-xs text-muted-foreground">{month}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
            <CardDescription>Share of applications by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Approved", n: stats.approved, color: "bg-emerald-500" },
              { label: "Pending", n: stats.pending, color: "bg-amber-500" },
              { label: "Under Review", n: stats.underReview, color: "bg-blue-500" },
              { label: "Rejected", n: stats.rejected, color: "bg-rose-500" },
            ].map((row) => {
              const pct = stats.total ? Math.round((row.n / stats.total) * 100) : 0;
              return (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                      {row.label}
                    </span>
                    <span className="font-semibold">{row.n} ({pct}%)</span>
                  </div>
                  <Progress value={pct} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
