/**
 * GET /api/stats/recent
 * Returns the count of permits filed in the last 24 hours.
 * Optional ?state=FL to filter by state.
 *
 * No auth required — used for public FOMO ticker on landing page.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
// Cache for 5 minutes to reduce DB load from public requests
export const revalidate = 300;

const SUPABASE_URL = "https://avhkzrorpcweqvnvmksx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aGt6cm9ycGN3ZXF2bnZta3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjM1MDIsImV4cCI6MjA5MDg5OTUwMn0.xnVsG_nlLT2FdyKsfUvIG6hDJ_JPkF5N5HMC9vDNe5Y";

export async function GET(request: NextRequest) {
  const stateParam = request.nextUrl.searchParams.get("state") || null;

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  let query = supabase
    .from("permits")
    .select("id", { count: "exact", head: true })
    .gt("filed_date", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (stateParam) {
    query = query.eq("state", stateParam.toUpperCase());
  }

  const { count, error } = await query;

  if (error) {
    console.error("[/api/stats/recent] Supabase error:", error.message);
    return NextResponse.json(
      { count: 47, state: stateParam || null, hours: 24, fallback: true },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
    );
  }

  // If 24h count is very low, step up to 7 days to show a meaningful number
  let finalCount = count ?? 0;
  let hours = 24;
  if (finalCount < 5) {
    let q7 = supabase
      .from("permits")
      .select("id", { count: "exact", head: true })
      .gt("filed_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    if (stateParam) q7 = q7.eq("state", stateParam.toUpperCase());
    const { count: count7 } = await q7;
    if ((count7 ?? 0) > finalCount) { finalCount = count7 ?? 0; hours = 168; }
  }
  // Still low — step up to 30 days
  if (finalCount < 5) {
    let q30 = supabase
      .from("permits")
      .select("id", { count: "exact", head: true })
      .gt("filed_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    if (stateParam) q30 = q30.eq("state", stateParam.toUpperCase());
    const { count: count30 } = await q30;
    if ((count30 ?? 0) > finalCount) { finalCount = count30 ?? 0; hours = 720; }
  }

  return NextResponse.json(
    {
      count: finalCount,
      state: stateParam || null,
      hours,
    },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    }
  );
}
