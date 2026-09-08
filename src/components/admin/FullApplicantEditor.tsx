import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Upload, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  updateApplicantDetails,
  type Application,
  type ApplicantCorrectionPayload,
} from "@/lib/applications";

const ASSET_BASE = "https://pitchcapital.ng/api/";
function resolveAssetUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return ASSET_BASE + path.replace(/^\/+/, "");
}

const TENOR_OPTIONS = Array.from({ length: 18 }, (_, i) => `${i + 1} month${i === 0 ? "" : "s"}`);

function toDateInputValue(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

type DocConfig = {
  key: "passport" | "signature" | "appointment_letter" | "staff_id_card" | "additional_document";
  label: string;
  currentUrl: string;
  accept: string;
};

function DocumentRow({
  config,
  file,
  onSelect,
}: {
  config: DocConfig;
  file: File | null;
  onSelect: (file: File | null) => void;
}) {
  const preview = file ? URL.createObjectURL(file) : "";
  const isImage = file ? file.type.startsWith("image/") : /\.(jpe?g|png)$/i.test(config.currentUrl);

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-secondary/40 flex items-center justify-center">
        {file ? (
          isImage ? (
            <img src={preview} alt={config.label} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[9px] text-center px-1 text-emerald-600 font-medium">New file selected</span>
          )
        ) : config.currentUrl ? (
          isImage ? (
            <img src={resolveAssetUrl(config.currentUrl)} alt={config.label} className="h-full w-full object-cover" />
          ) : (
            <a href={resolveAssetUrl(config.currentUrl)} target="_blank" rel="noreferrer" className="text-[9px] text-center px-1 text-primary underline">
              View current
            </a>
          )
        ) : (
          <span className="text-[9px] text-center px-1 text-muted-foreground">No file yet</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{config.label}</div>
        <div className="truncate text-xs text-muted-foreground">
          {file ? file.name : config.currentUrl ? "Current file on record" : "Not uploaded"}
        </div>
      </div>
      <Label htmlFor={`doc-${config.key}`} className="cursor-pointer shrink-0">
        <div className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/50">
          <Upload className="h-3 w-3" /> Replace
        </div>
      </Label>
      <input
        id={`doc-${config.key}`}
        type="file"
        accept={config.accept}
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export function FullApplicantEditor({
  app,
  allApplications,
  editorRole,
  onSaved,
}: {
  app: Application;
  allApplications: Application[];
  editorRole: string;
  onSaved: () => void;
}) {
  // Personal
  const [surname, setSurname] = useState(app.surname || "");
  const [firstName, setFirstName] = useState(app.firstName || app.first_name || "");
  const [middleName, setMiddleName] = useState(app.middleName || app.middle_name || "");
  const [dob, setDob] = useState(toDateInputValue(app.dob));
  const [maritalStatus, setMaritalStatus] = useState(app.maritalStatus || app.marital_status || "");

  // Contact
  const [address, setAddress] = useState(app.address || "");
  const [phone, setPhone] = useState(app.phone || "");

  // Employment
  const [ippis, setIppis] = useState(app.ippis || "");
  const [paypoint, setPaypoint] = useState(app.paypoint || "");
  const [dateOfEmployment, setDateOfEmployment] = useState(toDateInputValue(app.dateOfEmployment || app.date_of_employment));
  const [dateOfRetirement, setDateOfRetirement] = useState(toDateInputValue(app.dateOfRetirement || app.date_of_retirement));

  // Loan
  const [amountRequested, setAmountRequested] = useState(String(app.amountRequested || app.amount_requested || ""));
  const [tenor, setTenor] = useState(app.tenor || "");
  const [purpose, setPurpose] = useState(app.purpose || "");
  const [brokerCode, setBrokerCode] = useState(app.brokerCode || app.broker_code || "");
  const [loanType, setLoanType] = useState<"New Loan" | "Top Up" | "">(app.loanType || app.loan_type || "");
  const [pitchAccountNumber, setPitchAccountNumber] = useState(
    app.pitchcapitalAccountNumber || app.pitchcapital_account_number || "",
  );

  // Bank
  const [bank, setBank] = useState(app.bank || "");
  const [accountNo, setAccountNo] = useState(app.accountNo || app.account_no || "");
  const [altAccount, setAltAccount] = useState(app.altAccount || app.alt_account || "");
  const [bvn, setBvn] = useState(app.bvn || "");

  // Next of kin
  const [nokName, setNokName] = useState(app.nokName || app.nok_name || "");
  const [nokRelationship, setNokRelationship] = useState(app.nokRelationship || app.nok_relationship || "");
  const [nokAddress, setNokAddress] = useState(app.nokAddress || app.nok_address || "");
  const [nokPhone, setNokPhone] = useState(app.nokPhone || app.nok_phone || "");

  // Documents
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [appointmentLetterFile, setAppointmentLetterFile] = useState<File | null>(null);
  const [staffIdCardFile, setStaffIdCardFile] = useState<File | null>(null);
  const [additionalDocFile, setAdditionalDocFile] = useState<File | null>(null);
  const [additionalDocDescription, setAdditionalDocDescription] = useState("");

  const [saving, setSaving] = useState(false);

  // Top Up: auto-fill the internal account number from this customer's most
  // recent OTHER application (matched by BVN — the one reliably unique
  // identifier available) that already has one on record.
  useEffect(() => {
    if (loanType !== "Top Up") return;
    if (!bvn) return;
    const match = allApplications
      .filter((a) => String(a.id) !== String(app.id) && a.bvn && a.bvn === bvn)
      .filter((a) => a.pitchcapitalAccountNumber || a.pitchcapital_account_number)
      .sort((a, b) => +new Date(b.submittedAt || b.submitted_at || 0) - +new Date(a.submittedAt || a.submitted_at || 0))[0];
    if (match) {
      setPitchAccountNumber(match.pitchcapitalAccountNumber || match.pitchcapital_account_number || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanType, bvn]);

  const handleSave = async () => {
    if (!surname.trim() || !firstName.trim()) {
      toast.error("Surname and first name are required");
      return;
    }
    setSaving(true);
    try {
      const payload: ApplicantCorrectionPayload = {
        surname: surname.trim(),
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        dob: dob || undefined,
        marital_status: maritalStatus || undefined,
        address: address.trim(),
        phone: phone.trim(),
        ippis: ippis.trim(),
        paypoint: paypoint || undefined,
        date_of_employment: dateOfEmployment || undefined,
        date_of_retirement: dateOfRetirement || undefined,
        amount_requested: amountRequested || undefined,
        tenor: tenor || undefined,
        purpose: purpose.trim() || undefined,
        broker_code: brokerCode.trim() || undefined,
        loan_type: loanType || undefined,
        pitchcapital_account_number: pitchAccountNumber.trim() || undefined,
        bank: bank || undefined,
        account_no: accountNo.trim() || undefined,
        alt_account: altAccount.trim() || undefined,
        bvn: bvn.trim() || undefined,
        nok_name: nokName.trim() || undefined,
        nok_relationship: nokRelationship.trim() || undefined,
        nok_address: nokAddress.trim() || undefined,
        nok_phone: nokPhone.trim() || undefined,
        passport: passportFile || undefined,
        signature: signatureFile || undefined,
        appointment_letter: appointmentLetterFile || undefined,
        staff_id_card: staffIdCardFile || undefined,
        additional_document: additionalDocFile || undefined,
        additionalDocumentDescription: additionalDocFile ? additionalDocDescription.trim() : undefined,
      };

      const result = await updateApplicantDetails(app.id, payload);

      toast.success("Changes saved");
      (result?.replacedDocuments || []).forEach((name) => {
        toast.success(`${name} updated successfully`);
      });

      setPassportFile(null);
      setSignatureFile(null);
      setAppointmentLetterFile(null);
      setStaffIdCardFile(null);
      setAdditionalDocFile(null);
      setAdditionalDocDescription("");

      onSaved();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 print:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-4 w-4 text-primary" /> Edit Application ({editorRole})
          </CardTitle>
          <CardDescription>Every section below can be corrected. Nothing saves until you click "Save Changes" at the bottom.</CardDescription>
        </CardHeader>
      </Card>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Surname</Label><Input value={surname} onChange={(e) => setSurname(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>First name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Middle name</Label><Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Date of birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Marital status</Label>
            <Select value={maritalStatus} onValueChange={setMaritalStatus}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {["Single", "Married", "Divorced", "Widowed"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Residential address</Label><Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-sm">Employment Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>IPPIS / Staff ID</Label><Input value={ippis} onChange={(e) => setIppis(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Paypoint</Label><Input value={paypoint} onChange={(e) => setPaypoint(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Date of employment</Label><Input type="date" value={dateOfEmployment} onChange={(e) => setDateOfEmployment(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Date of retirement</Label><Input type="date" value={dateOfRetirement} onChange={(e) => setDateOfRetirement(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-sm">Loan Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Amount requested (₦)</Label><Input inputMode="numeric" value={amountRequested} onChange={(e) => setAmountRequested(e.target.value.replace(/[^0-9]/g, ""))} /></div>
          <div className="space-y-1.5">
            <Label>Tenor</Label>
            <Select value={tenor} onValueChange={setTenor}>
              <SelectTrigger><SelectValue placeholder="Select tenor" /></SelectTrigger>
              <SelectContent>{TENOR_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Purpose</Label><Textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Broker code</Label><Input value={brokerCode} onChange={(e) => setBrokerCode(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Loan type</Label>
            <Select value={loanType} onValueChange={(v) => setLoanType(v as "New Loan" | "Top Up")}>
              <SelectTrigger><SelectValue placeholder="Select loan type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="New Loan">New Loan</SelectItem>
                <SelectItem value="Top Up">Top Up</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loanType === "New Loan" && (
            <div className="space-y-1.5">
              <Label>PitchCapital account number</Label>
              <Input value={pitchAccountNumber} onChange={(e) => setPitchAccountNumber(e.target.value)} placeholder="Enter the generated account number" />
            </div>
          )}
          {loanType === "Top Up" && (
            <div className="space-y-1.5">
              <Label>PitchCapital account number (existing customer)</Label>
              <Input value={pitchAccountNumber} readOnly className="bg-muted" placeholder="No previous account number found for this BVN" />
              <p className="text-xs text-muted-foreground">Auto-filled from this customer's most recent prior loan, matched by BVN.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-sm">Bank Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Bank</Label><Input value={bank} onChange={(e) => setBank(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Account number</Label><Input value={accountNo} onChange={(e) => setAccountNo(e.target.value.replace(/[^0-9]/g, ""))} /></div>
          <div className="space-y-1.5"><Label>Alternate account</Label><Input value={altAccount} onChange={(e) => setAltAccount(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>BVN</Label><Input value={bvn} onChange={(e) => setBvn(e.target.value.replace(/[^0-9]/g, ""))} maxLength={11} /></div>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader><CardTitle className="text-sm">Guarantor / Next of Kin</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Name</Label><Input value={nokName} onChange={(e) => setNokName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Relationship</Label><Input value={nokRelationship} onChange={(e) => setNokRelationship(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={nokPhone} onChange={(e) => setNokPhone(e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Textarea rows={2} value={nokAddress} onChange={(e) => setNokAddress(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-sm">Documents</CardTitle>
          <CardDescription>The existing file for each document stays on record until a replacement upload actually succeeds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <DocumentRow
            config={{ key: "passport", label: "Passport Photograph", currentUrl: app.passport || "", accept: "image/jpeg,image/png" }}
            file={passportFile}
            onSelect={setPassportFile}
          />
          <DocumentRow
            config={{ key: "signature", label: "Signature", currentUrl: app.signatureUrl || app.signature_url || "", accept: "image/jpeg,image/png" }}
            file={signatureFile}
            onSelect={setSignatureFile}
          />
          <DocumentRow
            config={{ key: "appointment_letter", label: "Appointment Letter", currentUrl: (app as any).appointment_letter || "", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" }}
            file={appointmentLetterFile}
            onSelect={setAppointmentLetterFile}
          />
          <DocumentRow
            config={{ key: "staff_id_card", label: "Staff ID Card", currentUrl: (app as any).staff_id_card || "", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" }}
            file={staffIdCardFile}
            onSelect={setStaffIdCardFile}
          />
          <DocumentRow
            config={{ key: "additional_document", label: "Additional Document", currentUrl: "", accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png" }}
            file={additionalDocFile}
            onSelect={setAdditionalDocFile}
          />
          {additionalDocFile && (
            <div className="space-y-1.5 pl-1">
              <Label>What is this additional document?</Label>
              <Input
                value={additionalDocDescription}
                onChange={(e) => setAdditionalDocDescription(e.target.value)}
                placeholder="e.g. Evidence of change of name"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full print:hidden" size="lg">
        {saving ? (
          <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
}
