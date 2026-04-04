/**
 * Socrata fetcher + universal normaliser.
 *
 * Each source has a field_map that tells us which raw key corresponds
 * to which canonical permit field. The normaliser reads the map,
 * pulls values, and outputs a uniform row for Supabase.
 */

import { classifyPermit, estimateValue, type Classification } from "./classifier";
import type { DataSource } from "./sources";

/* ── fetch ──────────────────────────────────────────── */

export async function fetchSocrataPermits(
  source: DataSource,
  limit: number,
  lastPullAt: string | null,
) {
  const params = new URLSearchParams();
  params.set("$limit", String(limit));
  params.set("$order", source.order);

  if (lastPullAt) {
    const dateStr = new Date(lastPullAt).toISOString().split("T")[0];
    params.set("$where", `${source.date_field} >= '${dateStr}'`);
  }

  const url = `${source.endpoint}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Socrata ${source.id}: HTTP ${res.status} — ${body.slice(0, 200)}`);
  }

  const data = await res.json();

  // Socrata sometimes returns an error object instead of an array
  if (!Array.isArray(data)) {
    throw new Error(`Socrata ${source.id}: expected array, got ${typeof data}`);
  }

  return data;
}

/* ── normalise ──────────────────────────────────────── */

function str(raw: Record<string, any>, key?: string): string {
  if (!key) return "";
  const v = raw[key];
  if (v == null) return "";
  if (typeof v === "object" && v.url) return String(v.url); // Socrata link objects
  return String(v).trim();
}

function num(raw: Record<string, any>, key?: string): number {
  if (!key) return 0;
  const n = Number(raw[key]);
  return isNaN(n) ? 0 : n;
}

function dateStr(raw: Record<string, any>, key?: string): string | null {
  if (!key) return null;
  const v = raw[key];
  if (!v) return null;
  // Socrata dates: "2026-02-04T00:00:00.000" or "2026-02-04"
  return String(v).split("T")[0] || null;
}

/**
 * Special address assembly for sources that split address into parts.
 */
function buildAddress(raw: Record<string, any>, source: DataSource): string {
  const fm = source.field_map;

  // Chicago: street_number + street_direction + street_name
  if (source.id === "chicago_il") {
    return [raw.street_number, raw.street_direction, raw.street_name, raw.suffix]
      .filter(Boolean).join(" ").trim();
  }

  // SF: street_number + street_name + street_suffix + unit
  if (source.id === "sf_ca") {
    return [raw.street_number, raw.street_name, raw.street_suffix, raw.unit]
      .filter(Boolean).join(" ").trim();
  }

  // NYC: house__ + street_name
  if (source.id === "nyc_ny") {
    return [raw.house__, raw.street_name].filter(Boolean).join(" ").trim();
  }

  // Montgomery MD: stno + stname + suffix
  if (source.id === "montgomery_md") {
    return [raw.stno, raw.stname, raw.suffix].filter(Boolean).join(" ").trim();
  }

  return str(raw, fm.address);
}

export function normalizeSocrataPermit(
  raw: Record<string, any>,
  source: DataSource,
): Record<string, any> | null {
  const fm = source.field_map;

  const permitId = str(raw, fm.permit_id);
  const address = buildAddress(raw, source);

  if (!permitId || !address) return null;

  const permitType = str(raw, fm.permit_type);
  const description = str(raw, fm.description);
  const classification: Classification = classifyPermit(permitType, description);

  const rawValue = num(raw, fm.value);

  return {
    source_id: source.id,
    source_permit_id: `${source.id}:${permitId}`,
    permit_type: permitType.slice(0, 200),
    category: classification.category,
    subcategory: classification.subcategory,
    tags: classification.tags,
    address,
    city: str(raw, fm.city) || source.region,
    state: str(raw, fm.state) || source.state,
    zip_code: str(raw, fm.zip),
    county: source.region,
    applicant_name: str(raw, fm.applicant).slice(0, 300),
    contractor_name: str(raw, fm.contractor).slice(0, 300),
    contractor_license: str(raw, fm.contractor_license),
    description: `${permitType} ${description}`.trim().slice(0, 1000),
    estimated_value: rawValue > 0 ? rawValue : estimateValue(classification.category),
    filed_date: dateStr(raw, fm.filed_date) ?? dateStr(raw, fm.issued_date) ?? new Date().toISOString().split("T")[0],
    issued_date: dateStr(raw, fm.issued_date),
    status: (str(raw, fm.status) || "active").toLowerCase().slice(0, 50),
    latitude: raw[fm.latitude ?? ""] ? Number(raw[fm.latitude!]) : null,
    longitude: raw[fm.longitude ?? ""] ? Number(raw[fm.longitude!]) : null,
    raw_data: raw,
  };
}
