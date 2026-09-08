import * as XLSX from "xlsx";
import type { Application } from "./applications";

export type ApprovedExportRow = {
  Name: string;
  "Loan Amount": number | string;
  Bank: string;
  "Account Number": string;
  "Approved Amount": number | string;
};

export function applicantName(a: Application): string {
  const first = (a as any).firstName || (a as any).first_name || "";
  const middle = (a as any).middleName || (a as any).middle_name || "";
  return [first, middle, a.surname].filter(Boolean).join(" ").trim();
}

function num(v: unknown): number | string {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : "";
}

// The date an application was finalised — same reference the Approved list sorts by.
export function finalizedDateOf(a: Application): number {
  const raw =
    (a as any).reviewedAt ||
    (a as any).reviewed_at ||
    (a as any).completed_at ||
    (a as any).submittedAt ||
    (a as any).submitted_at ||
    0;
  return +new Date(raw);
}

export function filterApprovedByRange(
  apps: Application[],
  from: string,
  to: string,
): Application[] {
  const start = from ? +new Date(`${from}T00:00:00`) : -Infinity;
  const end = to ? +new Date(`${to}T23:59:59.999`) : Infinity;
  return apps
    .filter((a) => a.status === "Approved")
    .filter((a) => {
      const d = finalizedDateOf(a);
      return d >= start && d <= end;
    })
    .sort((a, b) => finalizedDateOf(a) - finalizedDateOf(b));
}

export function toExportRows(apps: Application[]): ApprovedExportRow[] {
  return apps.map((a) => ({
    Name: applicantName(a),
    "Loan Amount": num((a as any).amountRequested ?? (a as any).amount_requested),
    Bank: (a as any).bank || "",
    "Account Number": String((a as any).accountNo || (a as any).account_no || ""),
    "Approved Amount": num((a as any).approvedAmount ?? (a as any).approved_amount),
  }));
}

export function exportApprovedToExcel(apps: Application[], from: string, to: string): number {
  const rows = toExportRows(apps);
  if (rows.length === 0) return 0;

  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: ["Name", "Loan Amount", "Bank", "Account Number", "Approved Amount"],
  });

  sheet["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 18 }];

  // Naira number format on the two money columns, account number kept as text.
  const range = XLSX.utils.decode_range(sheet["!ref"] as string);
  for (let r = 1; r <= range.e.r; r++) {
    for (const c of [1, 4]) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "number") cell.z = '"₦"#,##0';
    }
    const acct = sheet[XLSX.utils.encode_cell({ r, c: 3 })];
    if (acct) acct.t = "s";
  }

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Approved");
  XLSX.writeFile(book, `pitchcapital-approved-${from}-to-${to}.xlsx`);
  return rows.length;
}
