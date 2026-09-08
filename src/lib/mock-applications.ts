// Application store. Designed so each field maps cleanly to a PHP/MySQL
// backend column — replace getAll/getById/update with fetch calls later.
export type AppStatus = "Pending" | "Under Review" | "Approved" | "Rejected";

export type TimelineEvent = {
  label: string;
  at: string; // ISO
  note?: string;
};

export type Application = {
  id: string;
  // personal
  passport: string;
  surname: string;
  firstName: string;
  middleName?: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  address: string;
  phone: string;
  email: string;
  // employment
  ippis: string;
  employer: string;
  dateOfEmployment: string;
  dateOfRetirement: string;
  paypoint: string;
  monthlyIncome: number;
  // loan
  amountRequested: number;
  tenor: string;
  purpose: string;
  // guarantor / NOK
  nokName: string;
  nokRelationship: string;
  nokPhone: string;
  nokAddress: string;
  // bank
  bank: string;
  accountNo: string;
  altAccount?: string;
  bvn: string;
  // documents
  documents: { name: string; type: string; url: string }[];
  // meta
  submittedAt: string;
  status: AppStatus;
  // review
  approvedAmount?: number;
  interestRate?: number;
  repaymentDuration?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  timeline: TimelineEvent[];
};

const KEY = "pc_admin_apps_v1";
let cache: Application[] | null = null;

function load(): Application[] {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = [];
    return cache;
  }
  const raw = window.localStorage.getItem(KEY);
  if (raw) {
    try {
      cache = JSON.parse(raw);
      return cache!;
    } catch {
      // fall through
    }
  }
  cache = [];
  window.localStorage.setItem(KEY, JSON.stringify(cache));
  return cache;
}

function persist() {
  if (typeof window !== "undefined" && cache) {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  }
}

export function getAllApplications(): Application[] {
  return load();
}

export function getApplicationById(id: string): Application | undefined {
  return load().find((a) => a.id === id);
}

export function updateApplication(id: string, patch: Partial<Application>) {
  const list = load();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  cache = list;
  persist();
}

export function appendTimeline(id: string, event: TimelineEvent) {
  const app = getApplicationById(id);
  if (!app) return;
  updateApplication(id, { timeline: [...app.timeline, event] });
}

export function formatNaira(n: number | undefined) {
  if (n === undefined || n === null) return "—";
  return "₦" + n.toLocaleString("en-NG");
}
