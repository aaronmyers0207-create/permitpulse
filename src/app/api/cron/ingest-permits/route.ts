/**
 * GET /api/cron/ingest-permits
 *
 * Legacy cron route — kept for backwards compatibility.
 * The preferred method is the admin sync UI at /admin.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import SOURCES from "@/lib/ingest/sources";
import { fetchSocrataPermits, normalizeSocrataPermit } from "@/lib/ingest/socrata";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results: { source: string; fetched: number; upserted: number; errors: number }[] = [];

  for (const source of SOURCES) {
    const sourceResult = { source: source.name, fetched: 0, upserted: 0, errors: 0 };

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
      const rawPermits = await fetchSocrataPermits(source, 1000, lastPullAt);
      sourceResult.fetched = rawPermits.length;

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

      const BATCH = 200;
      for (let i = 0; i < normalized.length; i += BATCH) {
        const batch = normalized.slice(i, i + BATCH);
        const { error } = await admin
          .from("permits")
          .upsert(batch, { onConflict: "source_permit_id" });

        if (error) {
          sourceResult.errors += batch.length;
        } else {
          sourceResult.upserted += batch.length;
        }
      }

      await admin.from("ingestion_logs").insert({
        source_id: source.id,
        source_name: source.name,
        status: sourceResult.errors > 0 ? "partial" : "success",
        permits_fetched: sourceResult.fetched,
        permits_upserted: sourceResult.upserted,
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sourceResult.errors = sourceResult.fetched || 1;

      await admin.from("ingestion_logs").insert({
        source_id: source.id,
        source_name: source.name,
        status: "error",
        error_message: message.slice(0, 1000),
        permits_fetched: 0,
        permits_upserted: 0,
        completed_at: new Date().toISOString(),
      });
    }

    results.push(sourceResult);
  }

  const totalUpserted = results.reduce((sum, r) => sum + r.upserted, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  return Response.json({ ok: true, timestamp: new Date().toISOString(), results });
}
