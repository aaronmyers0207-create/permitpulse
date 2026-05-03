/**
 * GET /api/admin/sources
 *
 * Returns the full source registry + last sync status for each.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import SOURCES from "@/lib/ingest/sources";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Get latest log per source
  const { data: logs } = await admin
    .from("ingestion_logs")
    .select("*")
    .order("completed_at", { ascending: false });

  // Get permit counts per source using SQL aggregation (not row scan)
  const { data: countRows } = await admin
    .rpc("get_permit_counts_by_source") as any;

  // Fallback: direct SQL if RPC not available
  let countMap: Record<string, number> = {};
  if (countRows && Array.isArray(countRows)) {
    for (const row of countRows) {
      countMap[row.source_id] = Number(row.count);
    }
  } else {
    // Direct query fallback
    const { data: rawCounts } = await admin
      .from("permits")
      .select("source_id, id", { count: "exact", head: false })
      .limit(100000);
    if (rawCounts) {
      for (const row of rawCounts) {
        countMap[row.source_id] = (countMap[row.source_id] || 0) + 1;
      }
    }
  }

  // Build latest log map (most recent per source_id)
  const logMap: Record<string, any> = {};
  if (logs) {
    for (const log of logs) {
      const sid = log.source_id || log.source_name;
      if (!logMap[sid]) logMap[sid] = log;
    }
  }

  const sources = SOURCES.map((s) => ({
    ...s,
    lastSync: logMap[s.id] || null,
    permitCount: countMap[s.id] || 0,
    field_map: undefined, // don't send to client
  }));

  return NextResponse.json({ sources });
}
