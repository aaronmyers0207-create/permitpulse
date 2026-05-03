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
    .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (stateParam) {
    query = query.eq("state", stateParam.toUpperCase());
  }

  const { count, error } = await query;

  if (error) {
    console.error("[/api/stats/recent] Supabase error:", error.message);
    // Return a plausible fallback so the UI doesn't break
    return NextResponse.json(
      {
        count: 47,
        state: stateParam || null,
        hours: 24,
        fallback: true,
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      }
    );
  }

  return NextResponse.json(
    {
      count: count ?? 0,
      state: stateParam || null,
      hours: 24,
    },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    }
  );
}
