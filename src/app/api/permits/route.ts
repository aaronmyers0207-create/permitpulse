/**
 * GET /api/permits?page=1&limit=50&category=hvac&state=TX&city=Austin
 *
 * Paginated permit query for the dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") || "50", 10)));
  const category = params.get("category") || "";
  const state = params.get("state") || "";
  const city = params.get("city") || "";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("permits")
    .select("*", { count: "exact" })
    .order("filed_date", { ascending: false });

  if (category) query = query.eq("category", category);
  if (state) query = query.eq("state", state);
  if (city) query = query.eq("city", city);

  const { data: permits, count, error } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    permits: permits || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
