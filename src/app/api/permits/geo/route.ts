/**
 * GET /api/permits/geo?bounds=sw_lat,sw_lng,ne_lat,ne_lng&category=hvac&limit=500
 *
 * Returns permits with coordinates within the map viewport.
 * Lightweight — only returns fields needed for map pins.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const bounds = params.get("bounds")?.split(",").map(Number);
  const category = params.get("category") || "";
  const limit = Math.min(1000, parseInt(params.get("limit") || "500", 10));

  let query = supabase
    .from("permits")
    .select("id,latitude,longitude,category,address,city,state,zip_code,applicant_name,contractor_name,estimated_value,filed_date,status,permit_type")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("filed_date", { ascending: false })
    .limit(limit);

  if (bounds && bounds.length === 4) {
    const [swLat, swLng, neLat, neLng] = bounds;
    query = query
      .gte("latitude", swLat)
      .lte("latitude", neLat)
      .gte("longitude", swLng)
      .lte("longitude", neLng);
  }

  if (category) query = query.eq("category", category);

  const { data: permits, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ permits: permits || [] });
}
