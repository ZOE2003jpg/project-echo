import { apiRequest } from "./api-client";

export type AppStatus =
  | "Pending"
  | "Under Review"
  | "Awaiting Front Desk"
  | "Awaiting Marketer"
  | "Back To Admin"
  | "Awaiting Operations & Disbursement"
  | "Completed"
  | "Approved"
  | "Rejected";

export type TimelineEvent = {
  id?: number;
  label: string;
  note?: string;
  occurred_at?: string;
  at?: string;
};

export type Application = {
  id: string | number;
  passport: string;
  signature_url?: string;
  signatureUrl?: string;
  surname: string;
  first_name?: string;
  firstName?: string;
  middle_name?: string;
  middleName?: string;
  dob: string;
  gender: string;
  marital_status?: string;
  maritalStatus?: string;
  address: string;
  phone: string;
  email: string;
  ippis: string;
  employer: string;
  date_of_employment?: string;
  dateOfEmployment?: string;
  date_of_retirement?: string;
  dateOfRetirement?: string;
  paypoint: string;
  monthly_income?: number | string;
  monthlyIncome?: number;
  amount_requested?: number | string;
  amountRequested?: number;
  tenor: string;
  purpose: string;
  nok_name?: string;
  nokName?: string;
  nok_relationship?: string;
  nokRelationship?: string;
  nok_phone?: string;
  nokPhone?: string;
  nok_address?: string;
  nokAddress?: string;
  bank: string;
  account_no?: string;
  accountNo?: string;
  alt_account?: string;
  altAccount?: string;
  bvn: string;
  current_stage?: string;
  documents: { name: string; type: string; url: string }[];
  submitted_at?: string;
  submittedAt?: string;
  updated_at?: string;
  updatedAt?: string;
  status: AppStatus;
  approved_amount?: number;
  approvedAmount?: number;
  interest_rate?: number;
  interestRate?: number;
  repayment_duration?: string;
  repaymentDuration?: string;
  review_notes?: string;
  reviewNotes?: string;
  reviewed_at?: string;
  reviewedAt?: string;
  // Front desk fields
  frontdesk_response?: string;
  frontdeskResponse?: string;
  frontdesk_notes?: string;
  frontdeskNotes?: string;
  frontdesk_at?: string;
  frontdeskAt?: string;
  // Marketer fields
  marketer_notes?: string;
  marketerNotes?: string;
  marketer_at?: string;
  marketerAt?: string;
  // Operations & Disbursement fields
  operations_notes?: string;
  operationsNotes?: string;
  // Broker / marketer referral code entered by the applicant on the public form
  broker_code?: string;
  brokerCode?: string;
  // Marketer-entered loan classification and internal account number
  loan_type?: "New Loan" | "Top Up";
  loanType?: "New Loan" | "Top Up";
  pitchcapital_account_number?: string;
  pitchcapitalAccountNumber?: string;
  timeline: TimelineEvent[];
};

export type ApplicationUpdatePayload = {
  status?: AppStatus;
  approvedAmount?: number;
  approved_amount?: number;
  interestRate?: number;
  interest_rate?: number;
  repaymentDuration?: string;
  repayment_duration?: string;
  reviewNotes?: string;
  review_notes?: string;
  // Front desk
  frontdesk_response?: string;
  frontdesk_notes?: string;
  // Marketer
  marketer_notes?: string;
  // Operations & Disbursement
  operations_notes?: string;
  // Stage routing
  current_stage?: string;
  completed_at?: string;
};

function normalizeApplication(app: any): Application {
  return {
    ...app,
    documents: app.documents || [],
    signatureUrl: app.signature_url || app.signatureUrl,
    firstName: app.first_name || app.firstName,
    middleName: app.middle_name || app.middleName,
    maritalStatus: app.marital_status || app.maritalStatus,
    dateOfEmployment: app.date_of_employment || app.dateOfEmployment,
    dateOfRetirement: app.date_of_retirement || app.dateOfRetirement,
    monthlyIncome: typeof app.monthly_income === "string"
      ? parseInt(app.monthly_income, 10)
      : app.monthly_income || app.monthlyIncome,
    amountRequested: typeof app.amount_requested === "string"
      ? parseInt(app.amount_requested, 10)
      : app.amount_requested || app.amountRequested,
    nokName: app.nok_name || app.nokName,
    nokRelationship: app.nok_relationship || app.nokRelationship,
    nokPhone: app.nok_phone || app.nokPhone,
    nokAddress: app.nok_address || app.nokAddress,
    accountNo: app.account_no || app.accountNo,
    altAccount: app.alt_account || app.altAccount,
    submittedAt: app.submitted_at || app.submittedAt,
    updatedAt: app.updated_at || app.updatedAt,
    approvedAmount: app.approved_amount || app.approvedAmount,
    interestRate: app.interest_rate || app.interestRate,
    repaymentDuration: app.repayment_duration || app.repaymentDuration,
    reviewNotes: app.review_notes || app.reviewNotes,
    reviewedAt: app.reviewed_at || app.reviewedAt,
    frontdeskResponse: app.frontdesk_response || app.frontdeskResponse,
    frontdeskNotes: app.frontdesk_notes || app.frontdeskNotes,
    frontdeskAt: app.frontdesk_at || app.frontdeskAt,
    marketerNotes: app.marketer_notes || app.marketerNotes,
    marketerAt: app.marketer_at || app.marketerAt,
    operationsNotes: app.operations_notes || app.operationsNotes,
    brokerCode: app.broker_code || app.brokerCode,
    loanType: app.loan_type || app.loanType,
    pitchcapitalAccountNumber: app.pitchcapital_account_number || app.pitchcapitalAccountNumber,
    timeline: (app.timeline || []).map((t: any) => ({
      ...t,
      at: t.occurred_at || t.at,
    })),
  };
}

export async function getAllApplications(): Promise<Application[]> {
  const result = await apiRequest<{ items: any[] }>("/admin/applications.php");
  return result.items.map(normalizeApplication);
}

export async function getApplicationById(id: string | number): Promise<Application> {
  const result = await apiRequest<any>(`/admin/application.php?id=${encodeURIComponent(String(id))}`);
  return normalizeApplication(result);
}

// Converts any camelCase review fields on the payload into the snake_case
// field names the backend actually accepts (api/admin/application.php only
// reads approved_amount, interest_rate, repayment_duration, review_notes).
// Snake_case values, if already present, take precedence over camelCase ones.
function normalizeUpdatePayload(patch: ApplicationUpdatePayload): Record<string, unknown> {
  const { approvedAmount, interestRate, repaymentDuration, reviewNotes, ...rest } = patch as any;

  const normalized: Record<string, unknown> = { ...rest };

  if (approvedAmount !== undefined && normalized.approved_amount === undefined) {
    normalized.approved_amount = approvedAmount;
  }
  if (interestRate !== undefined && normalized.interest_rate === undefined) {
    normalized.interest_rate = interestRate;
  }
  if (repaymentDuration !== undefined && normalized.repayment_duration === undefined) {
    normalized.repayment_duration = repaymentDuration;
  }
  if (reviewNotes !== undefined && normalized.review_notes === undefined) {
    normalized.review_notes = reviewNotes;
  }

  return normalized;
}

export async function updateApplication(id: string | number, patch: ApplicationUpdatePayload): Promise<void> {
  await apiRequest(`/admin/application.php?id=${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    body: normalizeUpdatePayload(patch),
  });
}

// Administrator/Marketer full editing of applicant-submitted data — every
// personal, contact, employment, loan, bank, and next-of-kin field, plus
// loan type / internal account number, plus replacing any of the 5
// documents. Uses FormData + POST (not PATCH) because PHP does not
// natively parse multipart bodies on PATCH requests — apiRequest already
// skips JSON-encoding for FormData.
export type ApplicantCorrectionPayload = {
  // Personal
  surname?: string;
  first_name?: string;
  middle_name?: string;
  dob?: string;
  marital_status?: string;
  // Contact
  address?: string;
  phone?: string;
  // Employment
  ippis?: string;
  paypoint?: string;
  date_of_employment?: string;
  date_of_retirement?: string;
  monthly_income?: string;
  // Loan
  amount_requested?: string;
  tenor?: string;
  purpose?: string;
  deduction_start?: string;
  broker_code?: string;
  loan_type?: "New Loan" | "Top Up";
  pitchcapital_account_number?: string;
  // Bank
  bank?: string;
  account_no?: string;
  alt_account?: string;
  bvn?: string;
  // Next of kin
  nok_name?: string;
  nok_relationship?: string;
  nok_address?: string;
  nok_phone?: string;
  // Documents (each optional and independent — only the ones actually
  // replaced need to be included)
  passport?: File;
  signature?: File;
  appointment_letter?: File;
  staff_id_card?: File;
  additional_document?: File;
  additionalDocumentDescription?: string;
};

export type ApplicantCorrectionResult = {
  success: boolean;
  replacedDocuments?: string[];
};

export async function updateApplicantDetails(
  id: string | number,
  payload: ApplicantCorrectionPayload,
): Promise<ApplicantCorrectionResult> {
  const formData = new FormData();
  formData.append("_method", "PATCH");

  const textFields: (keyof ApplicantCorrectionPayload)[] = [
    "surname", "first_name", "middle_name", "dob", "marital_status",
    "address", "phone",
    "ippis", "paypoint", "date_of_employment", "date_of_retirement", "monthly_income",
    "amount_requested", "tenor", "purpose", "deduction_start", "broker_code",
    "loan_type", "pitchcapital_account_number",
    "bank", "account_no", "alt_account", "bvn",
    "nok_name", "nok_relationship", "nok_address", "nok_phone",
    "additionalDocumentDescription",
  ];
  for (const field of textFields) {
    const value = payload[field];
    if (value !== undefined) formData.append(field, String(value));
  }

  if (payload.passport) formData.append("passport", payload.passport);
  if (payload.signature) formData.append("signature", payload.signature);
  if (payload.appointment_letter) formData.append("appointment_letter", payload.appointment_letter);
  if (payload.staff_id_card) formData.append("staff_id_card", payload.staff_id_card);
  if (payload.additional_document) formData.append("additional_document", payload.additional_document);

  return await apiRequest<ApplicantCorrectionResult>(`/admin/application.php?id=${encodeURIComponent(String(id))}`, {
    method: "POST",
    body: formData,
  });
}

export async function appendTimeline(id: string | number, event: TimelineEvent): Promise<void> {
  console.log("Timeline:", { id, event });
}

export type StatsData = {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  rejectionRate: number;
  totalApprovedAmount: number;
  months: { month: string; count: number }[];
};

export async function getStats(): Promise<StatsData> {
  const result = await apiRequest<any>("/admin/stats.php");
  return {
    total: result.total,
    pending: result.pending,
    underReview: result.review || 0,
    approved: result.approved,
    rejected: result.rejected,
    approvalRate: result.approvalRate,
    rejectionRate: result.total > 0 ? Math.round((result.rejected / result.total) * 100) : 0,
    totalApprovedAmount: result.totalApprovedAmount,
    months: result.monthly || [],
  };
}

export async function submitApplication(data: any): Promise<any> {
  const formData = new FormData();
  for (const key in data) {
    if (key === "passport" || key === "signature" || key === "appointmentLetter" || key === "appointment_letter" || key === "staffIdCard" || key === "staff_id_card" || key === "additionalDocument") continue;
    if (data[key] !== undefined && data[key] !== null) {
      if (typeof data[key] === "boolean") {
        formData.append(key, data[key] ? "1" : "0");
      } else if (data[key] instanceof Date) {
        formData.append(key, data[key].toISOString().split("T")[0]);
      } else if (key === "passportFile" && data[key]) {
        formData.append("passport", data[key]);
      } else if (key === "signatureFile" && data[key]) {
        formData.append("signature", data[key]);
      } else if (key === "appointmentLetterFile" && data[key]) {
        formData.append("appointment_letter", data[key]);
      } else if (key === "staffIdCardFile" && data[key]) {
        formData.append("staff_id_card", data[key]);
      } else if (key === "additionalDocumentFile" && data[key]) {
        formData.append("additional_document", data[key]);
      } else if (typeof data[key] !== "object" || data[key] instanceof File) {
        formData.append(key, String(data[key]));
      }
    }
  }

  const response = await fetch("/api/submit_application.php", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function formatNaira(n: number | undefined | null | string): string {
  if (n === undefined || n === null || n === "") return "—";
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  return "₦" + num.toLocaleString("en-NG");
}
