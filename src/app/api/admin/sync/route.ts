/**
 * POST /api/admin/sync
 *
 * Triggered by the admin UI sync button.
 * Body: { sourceId: string, limit?: number }
 *
 * Syncs a single data source into Supabase, returns counts.
 * No cron, no credits burned in the background — you click, it runs.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import SOURCES from "@/lib/ingest/sources";
import { fetchSocrataPermits, normalizeSocrataPermit } from "@/lib/ingest/socrata";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel function timeout

export async function POST(request: NextRequest) {
  // Auth check — must be a logged-in user
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: In production add an admin role check here
  // For now any authenticated user can trigger sync

  const body = await request.json().catch(() => ({}));
  const { sourceId, limit = 1000 } = body as { sourceId?: string; limit?: number };

  if (!sourceId) {
    return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
  }

  const source = SOURCES.find((s) => s.id === sourceId);
  if (!source) {
    return NextResponse.json({ error: `Unknown source: ${sourceId}` }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = { source: source.name, fetched: 0, upserted: 0, skipped: 0, errors: 0, errorMessages: [] as string[] };

  try {
    // Get last successful pull timestamp for incremental sync
    const { data: lastLog } = await admin
      .from("ingestion_logs")
      .select("completed_at")
      .eq("source_id", source.id)
      .eq("status", "success")
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    const lastPullAt = lastLog?.completed_at ?? null;

    console.log(`[sync] ${source.name}: fetching ${limit} permits since ${lastPullAt ?? "beginning"}`);

    const rawPermits = await fetchSocrataPermits(source, Math.min(limit, 5000), lastPullAt);
    result.fetched = rawPermits.length;

    if (rawPermits.length === 0) {
      await admin.from("ingestion_logs").insert({
        source_id: source.id,
        source_name: source.name,
        status: "success",
        permits_fetched: 0,
        permits_upserted: 0,
        completed_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, result });
    }

    // Normalise rows
    const normalized = rawPermits
      .map((raw: any) => normalizeSocrataPermit(raw, source))
      .filter((p): p is NonNullable<typeof p> => p !== null);

    result.skipped = result.fetched - normalized.length;

    // Upsert in batches of 200
    const BATCH = 200;
    for (let i = 0; i < normalized.length; i += BATCH) {
      const batch = normalized.slice(i, i + BATCH);
      const { error } = await admin
        .from("permits")
        .upsert(batch, { onConflict: "source_permit_id" });

      if (error) {
        console.error(`[sync] ${source.name}: upsert batch error`, error.message);
        result.errors += batch.length;
        result.errorMessages.push(error.message);
      } else {
        result.upserted += batch.length;
      }
    }

    // Log success
    await admin.from("ingestion_logs").insert({
      source_id: source.id,
      source_name: source.name,
      status: result.errors > 0 ? "partial" : "success",
      permits_fetched: result.fetched,
      permits_upserted: result.upserted,
      error_message: result.errorMessages.join("; ").slice(0, 1000) || null,
      completed_at: new Date().toISOString(),
    });

    console.log(`[sync] ${source.name}: done — ${result.upserted} upserted, ${result.errors} errors`);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[sync] ${source.name}: failed`, message);

    result.errors = result.fetched || 1;
    result.errorMessages.push(message);

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

  return NextResponse.json({ ok: true, result });
}
