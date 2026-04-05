/**
 * POST /api/skip-trace
 * Skip trace a permit's property owner via Tracerfy lookup API.
 * Uses the direct lookup endpoint (instant results by address).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTier, isAtSkipTraceLimit } from "@/lib/tiers";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const TRACERFY_TOKEN = process.env.TRACERFY_API_KEY || "";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const tier = getUserTier(profile);

  if (isAtSkipTraceLimit(tier, profile?.skip_traces_used || 0)) {
    return NextResponse.json({ error: "Skip trace limit reached", limit: tier.skipTraceLimit, used: profile?.skip_traces_used || 0 }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const { permitId } = body as { permitId?: string };
  if (!permitId) return NextResponse.json({ error: "permitId required" }, { status: 400 });

  const { data: permit } = await admin.from("permits").select("*").eq("id", permitId).single();
  if (!permit) return NextResponse.json({ error: "Permit not found" }, { status: 404 });

  // Return cached results if we already have contact data
  if (permit.skip_trace_data?.phones?.length > 0 || permit.skip_trace_data?.emails?.length > 0) {
    return NextResponse.json({ ok: true, cached: true, data: permit.skip_trace_data });
  }

  if (!TRACERFY_TOKEN) return NextResponse.json({ error: "Skip trace API not configured" }, { status: 500 });

  const address = permit.address || "";
  const city = permit.city || "";
  const state = permit.state || "";
  const zip = permit.zip_code || "";

  if (!address) return NextResponse.json({ error: "No address available" }, { status: 422 });

  try {
    // Direct lookup by address — instant results
    const payload: any = {
      address,
      city: city || (state === "FL" ? "Orlando" : "Unknown"),
      state,
      find_owner: true,
    };
    if (zip) payload.zip = zip;

    const res = await fetch("https://tracerfy.com/v1/api/trace/lookup/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TRACERFY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[skip-trace] Tracerfy error:", res.status, errorText);
      return NextResponse.json({ error: "Tracerfy API error", details: errorText }, { status: 502 });
    }

    const data = await res.json();

    // Build skip trace data from Tracerfy's persons array
    const skipTraceData: any = {
      status: data.hit ? "completed" : "no_hit",
      traced_at: new Date().toISOString(),
      address: `${address}, ${city}, ${state} ${zip}`.trim(),
      hit: data.hit || false,
      persons_count: data.persons_count || 0,
      credits_used: data.credits_deducted || 0,
      persons: [],
    };

    // Tracerfy lookup returns a persons array with full contact data
    if (Array.isArray(data.persons)) {
      skipTraceData.persons = data.persons.map((p: any) => ({
        name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        age: p.age || "",
        dob: p.dob || "",
        deceased: p.deceased || false,
        property_owner: p.property_owner || false,
        litigator: p.litigator || false,
        mailing_address: p.mailing_address || null,
        phones: (p.phones || []).map((ph: any) => ({
          number: ph.number || "",
          type: ph.type || "",
          dnc: ph.dnc || false,
          carrier: ph.carrier || "",
        })),
        emails: (p.emails || []).map((em: any) => typeof em === "string" ? em : em.email || em),
      }));
    }

    // Save to permit
    await admin.from("permits").update({ skip_trace_data: skipTraceData }).eq("id", permitId);

    // Increment usage
    await admin.from("profiles").update({ skip_traces_used: (profile?.skip_traces_used || 0) + 1 }).eq("id", user.id);

    return NextResponse.json({ ok: true, data: skipTraceData });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[skip-trace] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
