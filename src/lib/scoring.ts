/**
 * Lead scoring engine.
 *
 * Scores each permit 0-100 based on how actionable it is for a sales rep.
 * Higher = hotter lead.
 */

import type { Industry } from "./industries";

export type LeadTemp = "hot" | "warm" | "cold";

export interface LeadScore {
  score: number;
  temp: LeadTemp;
  reasons: string[];
}

export function scorePermit(permit: any, industry: Industry | null): LeadScore {
  let score = 0;
  const reasons: string[] = [];

  // Recency (0-30 pts)
  if (permit.filed_date) {
    const days = Math.floor((Date.now() - new Date(permit.filed_date).getTime()) / 86400000);
    if (days <= 3)       { score += 30; reasons.push("Filed in last 3 days"); }
    else if (days <= 7)  { score += 25; reasons.push("Filed this week"); }
    else if (days <= 30) { score += 15; reasons.push("Filed this month"); }
    else if (days <= 90) { score += 5;  reasons.push("Filed in last 90 days"); }
  }

  // Has owner name (0-20 pts) — can be skip traced
  if (permit.applicant_name && permit.applicant_name.trim().length > 2) {
    score += 20;
    reasons.push("Owner name available");
  }

  // Industry match (0-25 pts)
  if (industry && industry.categories.length > 0) {
    if (industry.categories.includes(permit.category)) {
      score += 25;
      reasons.push(`Matches your trade (${permit.category})`);
    }
  }

  // Value signal (0-15 pts)
  const val = Number(permit.estimated_value) || 0;
  if (val >= 100000)     { score += 15; reasons.push("High value ($100k+)"); }
  else if (val >= 25000) { score += 10; reasons.push("Mid value ($25k+)"); }
  else if (val > 0)      { score += 5;  reasons.push("Has estimated value"); }

  // Has contractor info — competitor intel (0-10 pts)
  if (permit.contractor_name && permit.contractor_name.trim().length > 2) {
    score += 10;
    reasons.push("Contractor on record");
  }

  // Active/open status
  if (permit.status && (permit.status === "active" || permit.status === "open")) {
    score += 5;
    reasons.push("Active permit");
  }

  // Determine temperature
  let temp: LeadTemp;
  if (score >= 60) temp = "hot";
  else if (score >= 35) temp = "warm";
  else temp = "cold";

  return { score, temp, reasons };
}

/** Lead disposition statuses */
export const LEAD_STATUSES = [
  { id: "new",            label: "New",            color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "contacted",      label: "Contacted",      color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "not_home",       label: "Not Home",       color: "bg-gray-100 text-gray-600 border-gray-200" },
  { id: "callback",       label: "Call Back",       color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "appt_set",       label: "Appt Set",       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "not_interested", label: "Not Interested", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { id: "sold",           label: "Sold",           color: "bg-green-50 text-green-700 border-green-200" },
] as const;

export const STATUS_MAP = Object.fromEntries(LEAD_STATUSES.map((s) => [s.id, s]));
