/**
 * POST /api/admin/sync-targeted
 * Targeted sync for a specific source + worktype filter.
 * Body: { sourceId: string, worktypeFilter?: string, limit?: number }
 *
 * Example: { sourceId: "orlando_fl", worktypeFilter: "Solar", limit: 5000 }
 * This adds a $where worktype='Solar' to the Socrata query.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import SOURCES from "@/lib/ingest/sources";
import { normalizeSocrataPermit } from "@/lib/ingest/socrata";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { sourceId, worktypeFilter, limit = 5000 } = body as { sourceId?: string; worktypeFilter?: string; limit?: number };

  if (!sourceId) return NextResponse.json({ error: "sourceId required" }, { status: 400 });

  const source = SOURCES.find((s) => s.id === sourceId);
  if (!source) return NextResponse.json({ error: `Unknown source: ${sourceId}` }, { status: 400 });

  const admin = createAdminClient();
  const result = { source: source.name, filter: worktypeFilter || "all", fetched: 0, upserted: 0, skipped: 0, errors: 0, errorMessages: [] as string[] };

  try {
    // Build custom query with worktype filter
    const params = new URLSearchParams();
    params.set("$limit", String(Math.min(limit, 50000)));
    if (source.order) params.set("$order", source.order);

    const conditions: string[] = [];
    if (source.date_field) conditions.push(`${source.date_field} IS NOT NULL`);
    if (worktypeFilter) conditions.push(`worktype='${worktypeFilter}'`);
    if (conditions.length > 0) params.set("$where", conditions.join(" AND "));

    const url = `${source.endpoint}?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(60_000) });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} — ${body.slice(0, 200)}`);
    }

    const rawPermits = await res.json();
    if (!Array.isArray(rawPermits)) throw new Error(`Expected array, got ${typeof rawPermits}`);

    result.fetched = rawPermits.length;

    // Normalize
    const allNormalized = rawPermits.map((raw: any) => normalizeSocrataPermit(raw, source)).filter((p): p is NonNullable<typeof p> => p !== null);
    const seen = new Set<string>();
    const normalized = allNormalized.filter((p) => { if (seen.has(p.source_permit_id)) return false; seen.add(p.source_permit_id); return true; });
    result.skipped = result.fetched - normalized.length;

    // Upsert in batches
    const BATCH = 200;
    for (let i = 0; i < normalized.length; i += BATCH) {
      const batch = normalized.slice(i, i + BATCH);
      const { error } = await admin.from("permits").upsert(batch, { onConflict: "source_permit_id" });
      if (error) { result.errors += batch.length; result.errorMessages.push(error.message); }
      else { result.upserted += batch.length; }
    }

    await admin.from("ingestion_logs").insert({
      source_id: source.id, source_name: `${source.name} (${worktypeFilter || "all"})`,
      status: result.errors > 0 ? "partial" : "success",
      permits_fetched: result.fetched, permits_upserted: result.upserted,
      error_message: result.errorMessages.join("; ").slice(0, 1000) || null,
      completed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors = result.fetched || 1;
    result.errorMessages.push(message);
  }

  return NextResponse.json({ ok: true, result });
}
