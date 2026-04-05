/**
 * POST /api/admin/geocode
 * Batch geocodes permits without coordinates using the free Census Bureau API.
 * Body: { sourceId?: string, limit?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function POST(request: NextRequest) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { sourceId, limit = 200 } = body as { sourceId?: string; limit?: number };

  const admin = createAdminClient();

  // Fetch permits without coordinates
  let query = admin.from("permits")
    .select("id, address, city, state, zip_code")
    .is("latitude", null)
    .limit(Math.min(limit, 500));

  if (sourceId) query = query.eq("source_id", sourceId);

  const { data: permits, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!permits || permits.length === 0) {
    return NextResponse.json({ ok: true, result: { total: 0, geocoded: 0, failed: 0 } });
  }

  let geocoded = 0;
  let failed = 0;

  for (const p of permits) {
    const addr = p.address || "";
    const city = p.city || "";
    const state = p.state || "";

    // Skip non-geocodable addresses
    if (addr.length < 5 || /PHASE|ADDITION|ESTATES|CROSSING|VILLAGE|PARK\s/i.test(addr)) {
      failed++;
      continue;
    }

    try {
      const params = new URLSearchParams({
        street: addr,
        city: city,
        state: state,
        benchmark: "Public_AR_Current",
        format: "json",
      });

      const res = await fetch(
        `https://geocoding.geo.census.gov/geocoder/locations/address?${params.toString()}`,
        { headers: { "User-Agent": "PermitTracer/1.0" }, signal: AbortSignal.timeout(10000) }
      );

      const data = await res.json();
      const matches = data?.result?.addressMatches || [];

      if (matches.length > 0) {
        const coords = matches[0].coordinates;
        const lat = coords?.y;
        const lng = coords?.x;

        if (lat && lng) {
          await admin.from("permits").update({ latitude: lat, longitude: lng }).eq("id", p.id);
          geocoded++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }

      await sleep(200); // Census API rate limit
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    result: { total: permits.length, geocoded, failed },
  });
}
