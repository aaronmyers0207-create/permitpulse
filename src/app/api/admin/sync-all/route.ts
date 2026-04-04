/**
 * POST /api/admin/sync-all
 *
 * Syncs ALL data sources sequentially. Triggered by the "Sync All" button.
 * Body: { limit?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import SOURCES from "@/lib/ingest/sources";
import { fetchSocrataPermits, normalizeSocrataPermit } from "@/lib/ingest/socrata";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for all sources

export async function POST(request: NextRequest) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { limit = 1000 } = body as { limit?: number };

  const admin = createAdminClient();
  const results: any[] = [];

  for (const source of SOURCES) {
    const result = { source: source.name, sourceId: source.id, fetched: 0, upserted: 0, skipped: 0, errors: 0, errorMessage: "" };

    try {
      const { data: lastLog } = await admin
        .from("ingestion_logs")
        .select("completed_at")
        .eq("source_id", source.id)
        .eq("status", "success")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      const lastPullAt = lastLog?.completed_at ?? null;
      const rawPermits = await fetchSocrataPermits(source, Math.min(limit, 5000), lastPullAt);
      result.fetched = rawPermits.length;

      const allNormalized = rawPermits
        .map((raw: any) => normalizeSocrataPermit(raw, source))
        .filter((p): p is NonNullable<typeof p> => p !== null);

      // Deduplicate within the batch
      const seen = new Set<string>();
      const normalized = allNormalized.filter((p) => {
        if (seen.has(p.source_permit_id)) return false;
        seen.add(p.source_permit_id);
        return true;
      });

      result.skipped = result.fetched - normalized.length;

      const BATCH = 200;
      for (let i = 0; i < normalized.length; i += BATCH) {
        const batch = normalized.slice(i, i + BATCH);
        const { error } = await admin
          .from("permits")
          .upsert(batch, { onConflict: "source_permit_id" });

        if (error) {
          result.errors += batch.length;
          result.errorMessage = error.message;
        } else {
          result.upserted += batch.length;
        }
      }

      await admin.from("ingestion_logs").insert({
        source_id: source.id,
        source_name: source.name,
        status: result.errors > 0 ? "partial" : "success",
        permits_fetched: result.fetched,
        permits_upserted: result.upserted,
        error_message: result.errorMessage || null,
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      result.errorMessage = err instanceof Error ? err.message : String(err);
      result.errors = 1;

      await admin.from("ingestion_logs").insert({
        source_id: source.id,
        source_name: source.name,
        status: "error",
        error_message: result.errorMessage.slice(0, 1000),
        permits_fetched: 0,
        permits_upserted: 0,
        completed_at: new Date().toISOString(),
      });
    }

    results.push(result);
  }

  const totalUpserted = results.reduce((s, r) => s + r.upserted, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);

  return NextResponse.json({
    ok: true,
    summary: { totalSources: SOURCES.length, totalUpserted, totalErrors },
    results,
  });
}
