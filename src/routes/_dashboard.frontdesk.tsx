import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Eye, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchInput } from "@/components/admin/SearchInput";
import { getAllApplications, formatNaira, type Application } from "@/lib/applications";
import { matchesApplicant } from "@/lib/search";
import { getRole } from "@/lib/admin-auth";

export const Route = createFileRoute("/_dashboard/frontdesk")({
  head: () => ({ meta: [{ title: "Front Desk Queue — Admin" }] }),
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: FrontDeskPage,
});


const ASSET_BASE = "https://pitchcapital.ng/api/";
function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return ASSET_BASE + path.replace(/^\/+/, "");
}

function FrontDeskPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = search.q ?? "";
  const setQuery = (q: string) =>
    navigate({ search: (prev) => (q ? { ...prev, q } : { ...prev, q: undefined }), replace: true });

  const [all, setAll] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const role = getRole();


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

  // Front desk only sees applications awaiting them
  const pending = role === "Administrator"
    ? all.filter((a) => a.status === "Awaiting Front Desk")
    : all.filter((a) => a.status === "Awaiting Front Desk");
  const history = all.filter((a) => a.status === "Completed");
  const apps = (tab === "pending" ? pending : history).filter((a) => matchesApplicant(a, query));


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-2" />
        <Card>
          <CardContent className="p-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full mb-3" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Front Desk Queue</h1>
        <p className="text-sm text-muted-foreground">Applications awaiting Front Desk contact.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "history")}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pending.length > 0 && (
              <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground leading-none">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-primary" /> {tab === "pending" ? "Assigned Applications" : "Completed Applications"}
              </CardTitle>
              <CardDescription>
                {apps.length} application{apps.length !== 1 ? "s" : ""}{" "}
                {tab === "pending" ? "in queue" : "completed"}
              </CardDescription>
            </div>
            <SearchInput value={query} onChange={setQuery} placeholder="Search by name" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {apps.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {query
                ? `No applicant matches "${query}".`
                : tab === "pending"
                ? "No applications in the Front Desk queue."
                : "No completed applications yet."}
            </div>

          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={resolveAssetUrl(a.passport)} alt={a.firstName || a.first_name || ""} />
                            <AvatarFallback>{(a.firstName || a.first_name || "")[0]}{a.surname[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{a.firstName || a.first_name} {a.surname}</div>
                            <div className="truncate text-xs text-muted-foreground">{a.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.paypoint || "—"}</TableCell>
                      <TableCell className="font-medium">{formatNaira(a.amountRequested || a.amount_requested)}</TableCell>
                      <TableCell className="font-medium text-emerald-600">{formatNaira(a.approvedAmount || a.approved_amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(a.submittedAt || a.submitted_at || 0), "MMM d, yyyy")}
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
