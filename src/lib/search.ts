import type { Application } from "./applications";

// Shared applicant matcher — name first, plus ID / email / phone so staff can
// find a person however they happen to know them.
export function matchesApplicant(a: Application, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    (a as any).firstName || (a as any).first_name,
    (a as any).middleName || (a as any).middle_name,
    a.surname,
    a.id,
    (a as any).email,
    (a as any).phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((term) => haystack.includes(term));
}
