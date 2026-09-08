import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft, Printer, FileText, User, Briefcase, Banknote, Users, Paperclip, Info, Check, XCircle, Clock, Building2, Send, CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Timeline } from "@/components/admin/Timeline";
import {
  getApplicationById, getAllApplications, updateApplication, formatNaira, type AppStatus, type Application,
} from "@/lib/applications";
import { getRole } from "@/lib/admin-auth";
import { FullApplicantEditor } from "@/components/admin/FullApplicantEditor";

const ASSET_BASE = "https://pitchcapital.ng/api/";

function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return ASSET_BASE + path.replace(/^\/+/, "");
}

export const Route = createFileRoute("/admin/application/$id")({
  head: () => ({ meta: [{ title: "Application Details — Admin" }] }),
  component: ApplicationDetailsPage,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <h2 className="text-lg font-semibold">Application not found</h2>
      <Button asChild variant="link" className="mt-2">
        <Link to="/admin/applications">Back to applications</Link>
      </Button>
    </div>
  ),
});

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 break-words text-sm font-medium text-foreground">{value ?? "—"}</div>
    </div>
  );
}

// Read-only summary of the Administrator's original loan assessment.
// Sourced strictly from the existing saved fields (approved_amount, interest_rate,
// repayment_duration, review_notes) — no new columns, no duplicated data.
// This always reflects the Administrator's saved decision and stays visible to
// Administrator, Front Desk, and Marketer for the lifetime of the application.
function LoanReviewSummary({ app }: { app: Application }) {
  const approvedAmount = app.approvedAmount ?? app.approved_amount;
  const interestRate = app.interestRate ?? app.interest_rate;
  const repaymentDuration = app.repaymentDuration ?? app.repayment_duration;
  const reviewNotes = app.reviewNotes ?? app.review_notes;

  const hasReview =
    approvedAmount != null || interestRate != null || !!repaymentDuration || !!reviewNotes;

  if (!hasReview) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Banknote className="h-4 w-4 text-primary" /> Loan Review &amp; Decision
        </CardTitle>
        <CardDescription>Administrator&apos;s approved loan terms and remarks (read-only).</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <Field label="Approved Amount" value={approvedAmount != null ? formatNaira(approvedAmount) : "—"} />
        <Field label="Interest Rate" value={interestRate != null ? `${interestRate}%` : "—"} />
        <Field label="Repayment Duration" value={repaymentDuration ?? "—"} />
        <div className="sm:col-span-2">
          <Field label="Administrator Review Notes" value={reviewNotes ?? "—"} />
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationDetailsPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getApplicationById(id);
        setApp(data);
      } catch (error) {
        console.error("Failed to fetch application:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const role = getRole();
  const [approvedAmount, setApprovedAmount] = useState("");
  const [interestRate, setInterestRate] = useState("12");
  const [repaymentDuration, setRepaymentDuration] = useState("12 months");
  const [reviewNotes, setReviewNotes] = useState("");

  const [frontdeskResponse, setFrontdeskResponse] = useState<"Accepted" | "Rejected" | "">("");
  const [frontdeskNotes, setFrontdeskNotes] = useState("");
  const [marketerNotes, setMarketerNotes] = useState("");
  const [operationsNotes, setOperationsNotes] = useState("");

  // Full applicant list — used only to look up a returning customer's
  // existing PitchCapital account number for the "Top Up" loan type.
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  useEffect(() => {
    getAllApplications().then(setAllApplications).catch((e) => console.error("Failed to fetch applications list:", e));
  }, []);

  useEffect(() => {
    if (app) {
      setApprovedAmount(app?.approvedAmount != null ? app.approvedAmount.toString() : "0");
      setInterestRate(app?.interestRate?.toString() ?? "12");
      setRepaymentDuration((app?.repaymentDuration ?? app?.tenor) ?? "12 months");
      setReviewNotes(app?.reviewNotes ?? "");

      setFrontdeskResponse((app?.frontdeskResponse || app?.frontdesk_response || "") as any);
      setFrontdeskNotes(app?.frontdeskNotes || app?.frontdesk_notes || "");
      setMarketerNotes(app?.marketerNotes || app?.marketer_notes || "");
      setOperationsNotes(app?.operationsNotes || app?.operations_notes || "");
    }
  }, [app]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 mb-2" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-lg font-semibold">Application not found</h2>
        <Button asChild variant="link" className="mt-2">
          <Link to="/admin/applications">Back to applications</Link>
        </Button>
      </div>
    );
  }

  const handleDecision = async (status: AppStatus, label: string, note?: string) => {
    setSaving(true);
    try {
      // Derive current_stage from status
      const stageMap: Partial<Record<AppStatus, string>> = {
        "Awaiting Front Desk": "Front Desk",
        "Awaiting Marketer": "Marketer",
        "Back To Admin": "Admin",
        "Awaiting Operations & Disbursement": "Operations",
        "Completed": "Admin",
        "Approved": "Admin",
        "Rejected": "Admin",
        "Under Review": "Admin",
      };

      await updateApplication(app.id, {
        status,
        current_stage: stageMap[status] ?? "Admin",
        approved_amount: approvedAmount !== "" ? Number(approvedAmount) : app.approvedAmount,
        interest_rate: interestRate !== "" ? Number(interestRate) : app.interestRate,
        repayment_duration: repaymentDuration || app.repaymentDuration,
        review_notes: reviewNotes || app.reviewNotes,
      });

      toast.success(`Application ${status.toLowerCase()}`);

      // Refetch the app — wrapped separately so a refetch failure
      // never overrides the success toast above.
      try {
        const updated = await getApplicationById(id);
        setApp(updated);
      } catch (refetchError) {
        console.error("Refetch after update failed:", refetchError);
      }

      router.invalidate();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to update application");
    } finally {
      setSaving(false);
    }
  };

  // Lets the Administrator update the approved amount/rate/duration on their
  // own, without forcing a status change — e.g. correcting an already-approved
  // amount. Reads everywhere in the app (the review summary, print view, etc.)
  // pull from the same approvedAmount/interestRate/repaymentDuration fields,
  // so saving here updates every display automatically.
  const handleUpdateTerms = async () => {
    setSavingTerms(true);
    try {
      await updateApplication(app.id, {
        approved_amount: approvedAmount !== "" ? Number(approvedAmount) : app.approvedAmount,
        interest_rate: interestRate !== "" ? Number(interestRate) : app.interestRate,
        repayment_duration: repaymentDuration || app.repaymentDuration,
        review_notes: reviewNotes || app.reviewNotes,
      });

      toast.success("Approved terms updated");

      try {
        const updated = await getApplicationById(id);
        setApp(updated);
      } catch (refetchError) {
        console.error("Refetch after update failed:", refetchError);
      }
      router.invalidate();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to update approved terms");
    } finally {
      setSavingTerms(false);
    }
  };

  const handleFrontDeskSubmit = async () => {
    if (!frontdeskResponse) {
      toast.error("Please select a Customer Decision (Accepted or Rejected)");
      return;
    }
    setSaving(true);
    try {
      await updateApplication(app.id, {
        status: "Back To Admin",
        current_stage: "Admin",
        frontdesk_response: frontdeskResponse,
        frontdesk_notes: frontdeskNotes,
      });

      toast.success("Sent Back To Admin");

      try {
        const updated = await getApplicationById(id);
        setApp(updated);
      } catch (refetchError) {
        console.error("Refetch failed:", refetchError);
      }
      router.invalidate();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to submit response");
    } finally {
      setSaving(false);
    }
  };

  const handleMarketerSubmit = async () => {
    if (!marketerNotes.trim()) {
      toast.error("Please provide Marketer notes before sending back to Admin");
      return;
    }
    setSaving(true);
    try {
      await updateApplication(app.id, {
        status: "Back To Admin",
        current_stage: "Admin",
        marketer_notes: marketerNotes,
      });

      toast.success("Sent Back To Admin");

      try {
        const updated = await getApplicationById(id);
        setApp(updated);
      } catch (refetchError) {
        console.error("Refetch failed:", refetchError);
      }
      router.invalidate();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to submit marketer notes");
    } finally {
      setSaving(false);
    }
  };

  const handleOperationsSubmit = async () => {
    if (!operationsNotes.trim()) {
      toast.error("Please provide Operations remarks before saving");
      return;
    }
    setSaving(true);
    try {
      await updateApplication(app.id, {
        operations_notes: operationsNotes,
      });

      toast.success("Operations remarks saved");

      try {
        const updated = await getApplicationById(id);
        setApp(updated);
      } catch (refetchError) {
        console.error("Refetch failed:", refetchError);
      }
      router.invalidate();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to save operations remarks");
    } finally {
      setSaving(false);
    }
  };

  const handleEditorSaved = async () => {
    try {
      const updated = await getApplicationById(id);
      setApp(updated);
    } catch (refetchError) {
      console.error("Refetch failed:", refetchError);
    }
    router.invalidate();
  };

  const passportUrl = resolveAssetUrl(app.passport);

  return (
    <div className="space-y-6">
      {/* Toolbar (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/applications">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to applications
          </Link>
        </Button>
        <Button onClick={() => window.print()} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print Application
        </Button>
      </div>

      {/* Print-only letterhead */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-primary pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xl font-bold">Pitch Capital Limited</div>
            <div className="text-xs text-muted-foreground">Official Loan Application Record</div>
          </div>
        </div>
        <div className="text-right text-xs">
          <div>Application ID: <strong>{app.id}</strong></div>
          <div>Generated: {format(new Date(), "PPP")}</div>
        </div>
      </div>

      {/* Applicant header */}
      <Card>
        <CardContent className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center">
          {passportUrl ? (
            <img
              src={passportUrl}
              alt={`${app.firstName || app.first_name} ${app.surname}`}
              className="h-32 w-32 shrink-0 rounded-xl border-4 border-primary/20 object-cover shadow-sm sm:h-36 sm:w-36"
            />
          ) : (
            <div className="grid h-32 w-32 shrink-0 place-items-center rounded-xl border-4 border-primary/20 bg-muted text-xs text-muted-foreground shadow-sm sm:h-36 sm:w-36">
              No photo
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold leading-tight">{app.firstName || app.first_name} {app.middleName || app.middle_name} {app.surname}</h2>
              <StatusBadge status={app.status} />
            </div>
            <div className="text-sm text-muted-foreground">{app.id} • Submitted {format(new Date(app.submittedAt || app.submitted_at || 0), "PPP")}</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 pt-2 text-sm sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Requested</div>
                <div className="font-semibold">{formatNaira(app.amountRequested || app.amount_requested)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tenor</div>
                <div className="font-semibold">{app.tenor}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Phone</div>
                <div className="font-semibold">{app.phone}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="truncate font-semibold">{app.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Broker Code</div>
                <div className="font-semibold">{app.brokerCode || app.broker_code || "—"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(role === "Administrator" || role === "Marketer") && (
        <FullApplicantEditor
          app={app}
          allApplications={allApplications}
          editorRole={role}
          onSaved={handleEditorSaved}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Personal Information" icon={User}>
            <Field label="Surname" value={app.surname} />
            <Field label="First name" value={app.firstName || app.first_name} />
            <Field label="Middle name" value={app.middleName || app.middle_name || "—"} />
            <Field label="Date of birth" value={app.dob ? format(new Date(app.dob), "PPP") : "—"} />
            <Field label="Gender" value={app.gender} />
            <Field label="Marital status" value={app.maritalStatus || app.marital_status} />
            <Field label="Phone" value={app.phone} />
            <Field label="Email" value={app.email} />
            <div className="sm:col-span-2">
              <Field label="Residential address" value={app.address} />
            </div>
          </Section>

          <Section title="Employment Information" icon={Briefcase}>
            <Field label="IPPIS / Staff ID" value={app.ippis} />
            <Field label="Employer" value={app.employer} />
            <Field label="Paypoint" value={app.paypoint} />
            <Field label="Monthly income" value={formatNaira(app.monthlyIncome || app.monthly_income)} />
            <Field label="Date of employment" value={(app.dateOfEmployment || app.date_of_employment) ? format(new Date(app.dateOfEmployment || app.date_of_employment || 0), "PPP") : "—"} />
            <Field label="Date of retirement" value={(app.dateOfRetirement || app.date_of_retirement) ? format(new Date(app.dateOfRetirement || app.date_of_retirement || 0), "PPP") : "—"} />
          </Section>

          <Section title="Loan Information" icon={Banknote}>
            <Field label="Amount requested" value={formatNaira(app.amountRequested || app.amount_requested)} />
            <Field label="Tenor" value={app.tenor} />
            <div className="sm:col-span-2">
              <Field label="Purpose" value={app.purpose} />
            </div>
            <Field label="Bank" value={app.bank} />
            <Field label="Account number" value={app.accountNo || app.account_no} />
            <Field label="Alternate account" value={app.altAccount || app.alt_account || "—"} />
            <Field label="BVN" value={app.bvn} />
            <Field label="Broker code" value={app.brokerCode || app.broker_code || "—"} />
            <Field label="Loan type" value={app.loanType || app.loan_type || "—"} />
            <Field label="PitchCapital account number" value={app.pitchcapitalAccountNumber || app.pitchcapital_account_number || "—"} />
            <Field label="Broker Code" value={app.brokerCode || app.broker_code || "—"} />
          </Section>

          <Section title="Guarantor / Next of Kin" icon={Users}>
            <Field label="Name" value={app.nokName || app.nok_name} />
            <Field label="Relationship" value={app.nokRelationship || app.nok_relationship} />
            <Field label="Phone" value={app.nokPhone || app.nok_phone} />
            <div className="sm:col-span-2">
              <Field label="Address" value={app.nokAddress || app.nok_address} />
            </div>
          </Section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-4 w-4 text-primary" /> Uploaded Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(app.documents || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <>
                  {(app.documents || []).map((d, i) => (
                    <a
                      key={i}
                      href={resolveAssetUrl(d.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary hover:bg-muted/50"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{d.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{d.type}</div>
                      </div>
                    </a>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <LoanReviewSummary app={app} />

          {(app.frontdeskResponse || app.frontdesk_response || app.frontdeskNotes || app.frontdesk_notes || app.marketerNotes || app.marketer_notes || app.operationsNotes || app.operations_notes) && (
            <Section title="Processing Feedback" icon={Briefcase}>
              {(app.frontdeskResponse || app.frontdesk_response) && (
                <Field label="Customer Decision" value={app.frontdeskResponse || app.frontdesk_response} />
              )}
              {(app.frontdeskNotes || app.frontdesk_notes) && (
                <Field label="Front Desk Notes" value={app.frontdeskNotes || app.frontdesk_notes} />
              )}
              {(app.marketerNotes || app.marketer_notes) && (
                <div className="sm:col-span-2">
                  <Field label="Marketer Notes" value={app.marketerNotes || app.marketer_notes} />
                </div>
              )}
              {(app.operationsNotes || app.operations_notes) && (
                <div className="sm:col-span-2">
                  <Field label="Operations Remarks" value={app.operationsNotes || app.operations_notes} />
                </div>
              )}
            </Section>
          )}

          <Section title="Additional Information" icon={Info}>
            <Field label="Submitted at" value={(app.submittedAt || app.submitted_at) ? format(new Date(app.submittedAt || app.submitted_at || 0), "PPP p") : "—"} />
            <Field label="Last reviewed" value={(app.reviewedAt || app.reviewed_at) ? format(new Date(app.reviewedAt || app.reviewed_at || 0), "PPP p") : "—"} />
          </Section>
        </div>

        <div className="space-y-6">
          {/* Review panel — hidden on print */}
          {role === "Administrator" && (
            <Card className="border-primary/30 print:hidden">
              <CardHeader>
                <CardTitle>Loan Review & Decision</CardTitle>
                <CardDescription>Capture the review terms before approving.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="approvedAmount">Approved amount (₦)</Label>
                  <Input id="approvedAmount" type="number" value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest rate (%)</Label>
                  <Input id="interestRate" type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Repayment duration</Label>
                  <Select value={repaymentDuration} onValueChange={setRepaymentDuration}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[
                        "1 month", "2 months", "3 months", "4 months", "5 months", "6 months",
                        "7 months", "8 months", "9 months", "10 months", "11 months", "12 months",
                        "13 months", "14 months", "15 months", "16 months", "17 months", "18 months",
                      ].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Review notes / remarks</Label>
                  <Textarea id="notes" rows={3} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Add a remark for the record" />
                </div>
                <Button
                  onClick={handleUpdateTerms}
                  disabled={savingTerms}
                  variant="secondary"
                  className="w-full"
                >
                  {savingTerms ? "Saving..." : "Update approved amount / terms"}
                </Button>
                <p className="text-xs text-muted-foreground -mt-2">
                  Saves the amount, rate, duration and notes above without changing the application's status — use this to correct an already-approved amount.
                </p>
                <Separator />

                <div className="grid grid-cols-1 gap-2">
                  <ConfirmAction
                    trigger={
                      <Button disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Check className="mr-2 h-4 w-4" /> Approve loan
                      </Button>
                    }
                    title="Approve this loan?"
                    description={`This will mark ${app.firstName || app.first_name} ${app.surname}'s application as Approved at ${formatNaira(Number(approvedAmount))}.`}
                    confirmLabel="Approve"
                    onConfirm={() => handleDecision("Approved", "Loan Approved", reviewNotes || `Approved at ${formatNaira(Number(approvedAmount))}`)}
                  />
                  <ConfirmAction
                    trigger={
                      <Button disabled={saving} variant="outline" className="w-full">
                        <Clock className="mr-2 h-4 w-4" /> Mark as under review
                      </Button>
                    }
                    title="Mark as under review?"
                    description="The applicant will be notified that their file is being reviewed."
                    confirmLabel="Mark under review"
                    onConfirm={() => handleDecision("Under Review", "Marked Under Review", reviewNotes || undefined)}
                  />
                  <ConfirmAction
                    trigger={
                      <Button disabled={saving} variant="destructive" className="w-full">
                        <XCircle className="mr-2 h-4 w-4" /> Reject loan
                      </Button>
                    }
                    title="Reject this loan?"
                    description="This action will mark the application as Rejected. Please add a remark explaining the decision."
                    confirmLabel="Reject"
                    destructive
                    onConfirm={() => handleDecision("Rejected", "Loan Rejected", reviewNotes || "Application rejected")}
                  />
                  <ConfirmAction
                    trigger={
                      <Button disabled={saving} variant="outline" className="w-full border-blue-500 text-blue-600 hover:bg-blue-50">
                        <Send className="mr-2 h-4 w-4" /> Send to Front Desk
                      </Button>
                    }
                    title="Send to Front Desk?"
                    description="This will route the application to the Front Desk for customer follow-up."
                    confirmLabel="Send"
                    onConfirm={() => handleDecision("Awaiting Front Desk", "Sent to Front Desk", reviewNotes || undefined)}
                  />
                  {(app.status === "Back To Admin") && (
                    <ConfirmAction
                      trigger={
                        <Button disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Ready to Disburse
                        </Button>
                      }
                      title="Mark as Ready to Disburse?"
                      description="This will route the application to Operations & Disbursement for final disbursement processing, marked as 'Ready to Disburse'."
                      confirmLabel="Ready to Disburse"
                      onConfirm={() => handleDecision("Awaiting Operations & Disbursement", "Ready to Disburse", "Ready to Disburse")}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {role === "Front Desk" && (
            <Card className="border-primary/30 print:hidden">
              <CardHeader>
                <CardTitle>Front Desk Action</CardTitle>
                <CardDescription>Record customer response and send back to Admin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {app.status === "Awaiting Front Desk" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="customerResponse">Customer Decision (Recorded by Front Desk)</Label>
                      <Select value={frontdeskResponse} onValueChange={(v: any) => setFrontdeskResponse(v)}>
                        <SelectTrigger id="customerResponse">
                          <SelectValue placeholder="Select response..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Accepted">Accepted</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frontdeskNotes">Notes / Remarks</Label>
                      <Textarea
                        id="frontdeskNotes"
                        rows={3}
                        value={frontdeskNotes}
                        onChange={(e) => setFrontdeskNotes(e.target.value)}
                        placeholder="Add details about the customer contact"
                      />
                    </div>
                    <Button onClick={handleFrontDeskSubmit} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Send className="mr-2 h-4 w-4" /> Send Back To Admin
                    </Button>
                  </>
                ) : (
                  <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground flex flex-col gap-2">
                    <div>This application is not currently awaiting Front Desk action.</div>
                    <div className="flex items-center gap-2"><strong>Current Status:</strong> <StatusBadge status={app.status} /></div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {role === "Marketer" && (
            <Card className="border-primary/30 print:hidden">
              <CardHeader>
                <CardTitle>Marketer — View Only</CardTitle>
                <CardDescription>Marketers have read-only access and cannot act on applications at any stage.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground flex flex-col gap-2">
                  <div className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> You may view the full application details on this page including recorded Front Desk feedback.</div>
                  <div className="flex items-center gap-2"><strong>Current Status:</strong> <StatusBadge status={app.status} /></div>
                </div>
              </CardContent>
            </Card>
          )}

          {role === "Operations & Disbursement" && (
            <Card className="border-primary/30 print:hidden">
              <CardHeader>
                <CardTitle>Operations & Disbursement Action</CardTitle>
                <CardDescription>Record operations remarks for this application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {app.status === "Awaiting Operations & Disbursement" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="operationsNotes">Operations Remarks</Label>
                      <Textarea
                        id="operationsNotes"
                        rows={3}
                        value={operationsNotes}
                        onChange={(e) => setOperationsNotes(e.target.value)}
                        placeholder="Add disbursement/operations remarks"
                      />
                    </div>
                    <Button onClick={handleOperationsSubmit} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                      <Send className="mr-2 h-4 w-4" /> Save Operations Remarks
                    </Button>
                  </>
                ) : (
                  <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground flex flex-col gap-2">
                    <div>This application is not currently awaiting Operations & Disbursement action.</div>
                    <div className="flex items-center gap-2"><strong>Current Status:</strong> <StatusBadge status={app.status} /></div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={app.timeline || []} />
            </CardContent>
          </Card>

          {/* Print-only approval summary */}
          <Card className="hidden print:block">
            <CardHeader><CardTitle className="text-base">Approval Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Status:</strong> {app.status}</div>
              <div><strong>Approved amount:</strong> {formatNaira(app.approvedAmount || app.approved_amount)}</div>
              <div><strong>Interest rate:</strong> {(app.interestRate || app.interest_rate) ? `${app.interestRate || app.interest_rate}%` : "—"}</div>
              <div><strong>Repayment:</strong> {(app.repaymentDuration || app.repayment_duration) ?? "—"}</div>
              <div><strong>Remarks:</strong> {(app.reviewNotes || app.review_notes) ?? "—"}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print-only signature section */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-12">
        <div>
          <div className="border-t pt-2 text-sm">Applicant signature & date</div>
        </div>
        <div>
          <div className="border-t pt-2 text-sm">Authorized officer signature & date</div>
        </div>
      </div>
    </div>
  );
}

function ConfirmAction({
  trigger, title, description, confirmLabel, onConfirm, destructive,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
