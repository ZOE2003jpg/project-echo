import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Building2 } from "lucide-react";
import logoUrl from "@/logo.jpg";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { submitApplication } from "@/lib/applications";
import { compressImageIfNeeded } from "@/lib/image-compression";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pitch Capital — Loan Application" },
      { name: "description", content: "Apply for a Pitch Capital loan in minutes. Secure, simple, and tailored for salary-earners." },
      { property: "og:title", content: "Pitch Capital — Loan Application" },
      { property: "og:description", content: "Apply for a Pitch Capital loan in minutes. Secure, simple, and tailored for salary-earners." },
    ],
  }),
  component: LoanApplication,
});

const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const RELATIONSHIPS = ["Spouse", "Parent", "Sibling", "Child", "Relative", "Friend", "Colleague"];
const PAYPOINTS = [
  "NPF", "NSCDC", "OYRTMA", "OYSHMB", "OYO TESCOM", "OYO SUBEB", "OYO PRY HEALTH",
  "OYO MIN EDU", "OXSROMA", "OYSREB", "EOSTAB", "UI", "KWA COLL", "KWA SUB",
  "KWARTMA", "KWA TES", "KWA MIN", "OSUN", "UNIMED", "OGUN SUBEB", "NON PAYROLL", "ONDO",
];
const TENORS = [
  "1 month", "2 months", "3 months", "4 months", "5 months", "6 months",
  "7 months", "8 months", "9 months", "10 months", "11 months", "12 months",
  "13 months", "14 months", "15 months", "16 months", "17 months", "18 months",
];
const BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Keystone Bank",
  "Lotus Bank",
  "Nova Merchant Bank",
  "Optimus Bank",
  "Parallex Bank",
  "Polaris Bank",
  "PremiumTrust Bank",
  "Providus Bank",
  "Signature Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank Nigeria",
  "Sterling Bank",
  "SunTrust Bank Nigeria",
  "TajBank",
  "Titan Trust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
  "Jaiz Bank",
  "Coronation Merchant Bank",
  "Rand Merchant Bank (RMB Nigeria)",
  "FSDH Merchant Bank",
  "Kuda Bank",
  "VFD Microfinance Bank",
  "Sparkle Microfinance Bank",
  "Rubies Microfinance Bank",
  "Mintyn Bank",
  "PalmPay",
  "Paga",
  "MoMo Payment Service Bank (MTN MoMo)",
  "9 Payment Service Bank (9PSB)",
  "SmartCash Payment Service Bank (Airtel)",
  "HopePSBank",
  "Mkobo Microfinance Bank",
  "NPF MFB (Nigeria Police Force MFB)",
  "Eyowo",
  "Carbon",
  "FairMoney",
  "ALAT by Wema",
];

type FormData = {
  passport: string;
  passportFile: File | null;
  surname: string; firstName: string; middleName: string;
  dob: Date | undefined; maritalStatus: string;
  address: string; phone: string;
  ippis: string; dateOfEmployment: Date | undefined; dateOfRetirement: Date | undefined;
  paypoint: string;
  nokName: string; nokAddress: string; nokPhone: string; nokRelationship: string;
  bank: string; accountNo: string; altAccount: string; bvn: string;
  existingLoan: string;
  loanAmount: string; tenor: string; deductionStart: Date | undefined;
  brokerCode: string;
  agree: boolean; signatureName: string;
  signature: string; signatureFile: File | null;
  appointmentLetter: string;
  appointmentLetterFile: File | null;
  staffIdCard: string;
  staffIdCardFile: File | null;
};

const initial: FormData = {
  passport: "",
  passportFile: null,
  surname: "", firstName: "", middleName: "",
  dob: undefined, maritalStatus: "",
  address: "", phone: "",
  ippis: "", dateOfEmployment: undefined, dateOfRetirement: undefined,
  paypoint: "",
  nokName: "", nokAddress: "", nokPhone: "", nokRelationship: "",
  bank: "", accountNo: "", altAccount: "", bvn: "",
  existingLoan: "",
  loanAmount: "", tenor: "", deductionStart: undefined,
  brokerCode: "",
  agree: false, signatureName: "",
  signature: "", signatureFile: null,
  appointmentLetter: "",
  appointmentLetterFile: null,
  staffIdCard: "",
  staffIdCardFile: null,
};

const STEPS = ["Personal", "Employment", "Bank & Next of Kin", "Loan & Agreement"];

function LoanApplication() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = <K extends keyof FormData>(k: K, v: FormData[K]) => setData((d) => ({ ...d, [k]: v }));

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!data.surname || !data.firstName || !data.dob || !data.maritalStatus || !data.address || !data.phone) {
        toast.error("Please fill all required fields."); return false;
      }
      if (!data.passport) { toast.error("Please upload a passport photograph."); return false; }
    }
    if (step === 1) {
      if (!data.ippis || !data.dateOfEmployment || !data.dateOfRetirement || !data.paypoint) {
        toast.error("Please fill all required fields."); return false;
      }
    }
    if (step === 2) {
      if (!data.nokName || !data.nokPhone || !data.nokRelationship || !data.bank || !data.accountNo || !data.bvn) {
        toast.error("Please fill all required fields."); return false;
      }
      if (data.bvn.length !== 11) { toast.error("BVN must be 11 digits."); return false; }
    }
    if (step === 3) {
      if (!data.loanAmount || !data.tenor || !data.agree || !data.signatureName) {
        toast.error("Complete loan details and accept the agreement."); return false;
      }
      if (!data.signature) { toast.error("Please upload a photo of your signature."); return false; }
      if (!data.appointmentLetter) { toast.error("Please upload your appointment letter."); return false; }
      if (!data.staffIdCard) { toast.error("Please upload your staff ID card."); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(STEPS.length - 1, s + 1)); };
  const prev = () => setStep((s) => Math.max(0, s - 1));
  const submit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      // Prepare data for API (convert dates to strings, etc.)
      const apiData = {
        ...data,
        dob: data.dob ? format(data.dob, "yyyy-MM-dd") : undefined,
        dateOfEmployment: data.dateOfEmployment ? format(data.dateOfEmployment, "yyyy-MM-dd") : undefined,
        dateOfRetirement: data.dateOfRetirement ? format(data.dateOfRetirement, "yyyy-MM-dd") : undefined,
        deductionStart: data.deductionStart ? format(data.deductionStart, "yyyy-MM-dd") : undefined,
      };
      await submitApplication(apiData);
      setSubmitted(true);
      toast.success("Application submitted successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="app-canvas flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-border/70 bg-card p-10 text-center shadow-lift">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl brand-gradient text-primary-foreground shadow-soft">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Application received</h1>
          <p className="mt-3 text-muted-foreground">
            Thank you, {data.firstName}. Our team will review your application and get back to you within 48 hours.
          </p>
          <Button variant="brand" size="lg" className="mt-7" onClick={() => { setSubmitted(false); setStep(0); setData(initial); }}>
            Submit another application
          </Button>
        </div>
        <Toaster />
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="app-canvas min-h-screen">
      <header className="sticky top-0 z-30 border-b border-primary-foreground/10 brand-gradient text-primary-foreground shadow-soft">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/25">
              <img src={logoUrl} alt="Pitch Capital Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-tight">Pitch Capital Limited</div>
              <div className="text-xs opacity-80">Loans · Investments · Advisory</div>
            </div>
          </div>
          <div className="hidden text-right text-xs opacity-85 sm:block">
            <div>info@pitchcapital.ng</div>
            <div>0808 553 3191</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Building2 className="h-3.5 w-3.5" /> Salary-earner facility
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Loan Application</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Four short steps. Your details are encrypted and reviewed within 48 hours.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-soft backdrop-blur sm:p-5">
          <div className="mb-3 grid grid-cols-4 gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex min-w-0 items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all",
                  i < step && "border-transparent bg-accent text-accent-foreground",
                  i === step && "border-transparent brand-gradient text-primary-foreground shadow-soft ring-4 ring-primary/15",
                  i > step && "border-border bg-background text-muted-foreground",
                )}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn(
                  "hidden truncate text-xs sm:block sm:text-sm",
                  i === step ? "font-semibold text-foreground" : "text-muted-foreground",
                )}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-lift sm:p-8">
          {step === 0 && <PersonalStep data={data} update={update} />}
          {step === 1 && <EmploymentStep data={data} update={update} />}
          {step === 2 && <BankNokStep data={data} update={update} />}
          {step === 3 && <LoanStep data={data} update={update} />}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/70 pt-6">
            <Button variant="outline" onClick={prev} disabled={step === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="brand" onClick={next}>Continue <ChevronRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button variant="brand" size="lg" onClick={submit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit application"}
              </Button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Information you provide is treated in strict confidence.
        </p>
      </main>
      <Toaster />
    </div>
  );
}


type StepProps = { data: FormData; update: <K extends keyof FormData>(k: K, v: FormData[K]) => void };

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
    </div>
  );
}

function DateField({ value, onChange, placeholder, max }: { value: Date | undefined; onChange: (d: Date | undefined) => void; placeholder: string; max?: Date }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="w-4 h-4 mr-2" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          captionLayout="dropdown"
          defaultMonth={value ?? new Date(1990, 0)}
          startMonth={new Date(1940, 0)}
          endMonth={max ?? new Date(2070, 11)}
          disabled={max ? { after: max } : undefined}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-6 border-l-4 border-primary/70 pl-3">
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}
    </div>
  );
}


function PersonalStep({ data, update }: StepProps) {
  const onPassport = async (file: File | undefined) => {
    if (!file) return;
    const optimized = await compressImageIfNeeded(file);
    if (optimized.size > 3 * 1024 * 1024) { toast.error("Image must be under 3MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      update("passport", String(reader.result));
      update("passportFile", optimized);
    };
    reader.readAsDataURL(optimized);
  };
  return (
    <div>
      <SectionTitle title="Personal information" desc="Tell us a bit about yourself." />

      <div className="mb-5 flex items-start gap-4">
        <div className="w-28 h-32 rounded-md border bg-secondary/40 overflow-hidden flex items-center justify-center shrink-0">
          {data.passport ? (
            <img src={data.passport} alt="Passport preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-muted-foreground text-center px-2">Passport photograph</span>
          )}
        </div>
        <div className="flex-1">
          <Label className="text-sm">Passport photograph <span className="text-destructive">*</span></Label>
          <p className="text-xs text-muted-foreground mt-1 mb-2">Upload a recent passport-style photo (JPG/PNG, max 3MB).</p>
          <Input type="file" accept="image/*" onChange={(e) => onPassport(e.target.files?.[0])} />
          {data.passport && (
            <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => {
              update("passport", "");
              update("passportFile", null);
            }}>
              Remove photo
            </Button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Surname" required><Input value={data.surname} onChange={(e) => update("surname", e.target.value)} /></Field>
        <Field label="First name" required><Input value={data.firstName} onChange={(e) => update("firstName", e.target.value)} /></Field>
        <Field label="Middle name"><Input value={data.middleName} onChange={(e) => update("middleName", e.target.value)} /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Date of birth" required>
          <DateField value={data.dob} onChange={(d) => update("dob", d)} placeholder="Pick your date of birth" max={new Date()} />
        </Field>
        <Field label="Marital status" required>
          <Select value={data.maritalStatus} onValueChange={(v) => update("maritalStatus", v)}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {MARITAL.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Permanent address" required>
          <Textarea rows={3} value={data.address} onChange={(e) => update("address", e.target.value)} />
        </Field>
        <Field label="Telephone number" required>
          <Input type="tel" value={data.phone} onChange={(e) => update("phone", e.target.value)} placeholder="080X XXX XXXX" />
        </Field>
      </div>
    </div>
  );
}

function EmploymentStep({ data, update }: StepProps) {
  return (
    <div>
      <SectionTitle title="Employment details" desc="Your payroll and employer information." />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="IPPIS / Staff number" required><Input value={data.ippis} onChange={(e) => update("ippis", e.target.value)} /></Field>
        <Field label="Paypoint" required>
          <Select value={data.paypoint} onValueChange={(v) => update("paypoint", v)}>
            <SelectTrigger><SelectValue placeholder="Select paypoint" /></SelectTrigger>
            <SelectContent>
              {PAYPOINTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Date of employment" required>
          <DateField value={data.dateOfEmployment} onChange={(d) => update("dateOfEmployment", d)} placeholder="Pick a date" max={new Date()} />
        </Field>
        <Field label="Date of retirement" required>
          <DateField value={data.dateOfRetirement} onChange={(d) => update("dateOfRetirement", d)} placeholder="Pick a date" />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Existing monthly loan deduction (₦)">
          <Input inputMode="numeric" value={data.existingLoan} onChange={(e) => update("existingLoan", e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" />
        </Field>
      </div>
    </div>
  );
}

function BankNokStep({ data, update }: StepProps) {
  return (
    <div>
      <SectionTitle title="Bank & next of kin" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Bank" required>
          <Select value={data.bank} onValueChange={(v) => update("bank", v)}>
            <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
            <SelectContent>
              {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Account number" required>
          <Input inputMode="numeric" maxLength={10} value={data.accountNo} onChange={(e) => update("accountNo", e.target.value.replace(/[^0-9]/g, ""))} />
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Alternate account details">
          <Input value={data.altAccount} onChange={(e) => update("altAccount", e.target.value)} placeholder="Bank · Account no" />
        </Field>
        <Field label="BVN" required>
          <Input inputMode="numeric" maxLength={11} value={data.bvn} onChange={(e) => update("bvn", e.target.value.replace(/[^0-9]/g, ""))} placeholder="11 digits" />
        </Field>
      </div>

      <div className="border-t my-6" />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Next of kin — full name" required>
          <Input value={data.nokName} onChange={(e) => update("nokName", e.target.value)} />
        </Field>
        <Field label="Relationship" required>
          <Select value={data.nokRelationship} onValueChange={(v) => update("nokRelationship", v)}>
            <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Next of kin address">
          <Textarea rows={3} value={data.nokAddress} onChange={(e) => update("nokAddress", e.target.value)} />
        </Field>
        <Field label="Next of kin phone" required>
          <Input type="tel" value={data.nokPhone} onChange={(e) => update("nokPhone", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function LoanStep({ data, update }: StepProps) {
  const onSignature = async (file: File | undefined) => {
    if (!file) return;
    const optimized = await compressImageIfNeeded(file);
    if (optimized.size > 3 * 1024 * 1024) { toast.error("Image must be under 3MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      update("signature", String(reader.result));
      update("signatureFile", optimized);
    };
    reader.readAsDataURL(optimized);
  };
  const onAppointmentLetter = async (file: File | undefined) => {
    if (!file) return;
    const optimized = await compressImageIfNeeded(file);
    if (optimized.size > 5 * 1024 * 1024) { toast.error("Document must be under 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      update("appointmentLetter", String(reader.result));
      update("appointmentLetterFile", optimized);
    };
    reader.readAsDataURL(optimized);
  };
  const onStaffIdCard = async (file: File | undefined) => {
    if (!file) return;
    const optimized = await compressImageIfNeeded(file);
    if (optimized.size > 5 * 1024 * 1024) { toast.error("Document must be under 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      update("staffIdCard", String(reader.result));
      update("staffIdCardFile", optimized);
    };
    reader.readAsDataURL(optimized);
  };
  return (
    <div>
      <SectionTitle title="Loan request & agreement" desc="Specify the amount and review the terms." />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Loan amount requested (₦)" required>
          <Input inputMode="numeric" value={data.loanAmount} onChange={(e) => update("loanAmount", e.target.value.replace(/[^0-9]/g, ""))} />
        </Field>
        <Field label="Tenor" required>
          <Select value={data.tenor} onValueChange={(v) => update("tenor", v)}>
            <SelectTrigger><SelectValue placeholder="Select tenor" /></SelectTrigger>
            <SelectContent>
              {TENORS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Preferred deduction start date">
          <DateField value={data.deductionStart} onChange={(d) => update("deductionStart", d)} placeholder="Pick a date" />
        </Field>
        <Field label="Broker code (optional)">
          <Input value={data.brokerCode} onChange={(e) => update("brokerCode", e.target.value)} />
        </Field>
      </div>

      <div className="mt-6 rounded-lg border bg-secondary/40 p-4 max-h-72 overflow-y-auto text-xs text-foreground leading-relaxed space-y-3">
        <p className="font-semibold text-sm">Loan Agreement — Terms & Conditions</p>

        <p><span className="font-semibold">1. Authorization to Verify.</span> I hereby authorize Pitch Capital Limited (hereinafter "the Company") to make any and all enquiries it considers necessary to verify the information provided in this application, including but not limited to references to my employer, bankers, credit bureaus, and any other person or institution.</p>

        <p><span className="font-semibold">2. Salary Deduction at Source.</span> I irrevocably authorize my employer and/or the relevant salary-paying authority (IPPIS, State Treasury, or Parastatal) to deduct from my monthly salary the agreed instalment and remit same directly to Pitch Capital Limited, until the loan together with all interest, fees and charges has been fully repaid.</p>

        <p><span className="font-semibold">3. Interest, Fees & Charges.</span> The loan attracts interest, management fees, insurance and processing fees at the prevailing rate published by the Company at the time of disbursement. I acknowledge that these charges form part of the total repayable amount.</p>

        <p><span className="font-semibold">4. Pre-Liquidation / Top-Up Penalty.</span> Any pre-liquidation, refinancing, or top-up of this loan attracts a penal charge of ten percent (10%) of the outstanding principal in the first month, and seven and a half percent (7.5%) per month from the second month up to the sixth month. After the sixth month, the Company's standard pre-liquidation policy shall apply.</p>

        <p><span className="font-semibold">5. Default & Recovery.</span> Failure to meet any repayment when due shall constitute default. In the event of default, the entire outstanding balance shall become immediately due and payable, and the Company shall be entitled to recover same through any lawful means, including direct debit on my designated and alternate bank accounts, instruction to my employer, or legal action — the cost of which shall be borne by me.</p>

        <p><span className="font-semibold">6. Leaving Service.</span> Should I resign, retire, be dismissed, transferred, or otherwise leave service before the loan is fully repaid, I irrevocably authorize my employer to recover any outstanding balance from my terminal benefits, gratuity, pension, or any other entitlement due to me, and remit same to Pitch Capital Limited.</p>

        <p><span className="font-semibold">7. Existing Obligations.</span> I declare that I have no other pending payroll-deductible loan obligation that has not been disclosed in this application, and I undertake not to obtain any further salary-deductible facility from any other institution without the prior written consent of Pitch Capital Limited while this loan subsists.</p>

        <p><span className="font-semibold">8. Bank Account Mandate.</span> I confirm that the bank account details provided are correct and are in my name. I authorize the Company to place a lien on, set off against, or debit the said account (and the alternate account provided) for any sum due under this agreement.</p>

        <p><span className="font-semibold">9. Data & Credit Reporting.</span> I consent to my personal and credit information being shared with licensed credit bureaus, the Central Bank of Nigeria, and other regulatory bodies, and to my details being reported in the event of default.</p>

        <p><span className="font-semibold">10. Declaration.</span> I declare that the information provided in this application is true, complete and accurate to the best of my knowledge, and I understand that any false statement may result in the rejection of this application, recall of the facility, and/or prosecution. I have read and understood the terms above and accept them without reservation.</p>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <Checkbox id="agree" checked={data.agree} onCheckedChange={(v) => update("agree", Boolean(v))} className="mt-1" />
        <Label htmlFor="agree" className="text-sm font-normal leading-snug cursor-pointer">
          I have read, understood and agree to the terms and conditions above.
        </Label>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <Field label="Signature (type your full name)" required>
          <Input value={data.signatureName} onChange={(e) => update("signatureName", e.target.value)} placeholder="Full name as signature" />
        </Field>
        <Field label="Signature photo" required>
          <div className="flex items-start gap-3">
            <div className="w-28 h-16 rounded-md border bg-secondary/40 overflow-hidden flex items-center justify-center shrink-0">
              {data.signature ? (
                <img src={data.signature} alt="Signature preview" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-muted-foreground text-center px-2">Signature photo</span>
              )}
            </div>
            <div className="flex-1">
              <Input type="file" accept="image/*" onChange={(e) => onSignature(e.target.files?.[0])} />
              {data.signature && (
                <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={() => {
                  update("signature", "");
                  update("signatureFile", null);
                }}>
                  Remove photo
                </Button>
              )}
            </div>
          </div>
        </Field>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-4 border-t pt-4">
        <Field label="Appointment letter" required>
          <div className="flex items-start gap-3">
            <div className="w-28 h-16 rounded-md border bg-secondary/40 overflow-hidden flex items-center justify-center shrink-0 text-center p-1">
              {data.appointmentLetter ? (
                <span className="text-[10px] text-emerald-600 font-semibold break-all truncate w-full px-1">Document Uploaded</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">No document uploaded</span>
              )}
            </div>
            <div className="flex-1">
              <Input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => onAppointmentLetter(e.target.files?.[0])} />
              {data.appointmentLetter && (
                <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs text-destructive" onClick={() => {
                  update("appointmentLetter", "");
                  update("appointmentLetterFile", null);
                }}>
                  Remove file
                </Button>
              )}
            </div>
          </div>
        </Field>
        <Field label="Staff ID card" required>
          <div className="flex items-start gap-3">
            <div className="w-28 h-16 rounded-md border bg-secondary/40 overflow-hidden flex items-center justify-center shrink-0 text-center p-1">
              {data.staffIdCard ? (
                <span className="text-[10px] text-emerald-600 font-semibold break-all truncate w-full px-1">Document Uploaded</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">No document uploaded</span>
              )}
            </div>
            <div className="flex-1">
              <Input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => onStaffIdCard(e.target.files?.[0])} />
              {data.staffIdCard && (
                <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs text-destructive" onClick={() => {
                  update("staffIdCard", "");
                  update("staffIdCardFile", null);
                }}>
                  Remove file
                </Button>
              )}
            </div>
          </div>
        </Field>
      </div>

      <footer className="mt-10 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
        Designed &amp; Developed by{" "}
        <a
          href="https://zoedeve.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"

        >
          Zoefx Technologies
        </a>
      </footer>
    </div>
  );
}
