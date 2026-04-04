/**
 * POST /api/skip-trace
 * Skip trace a permit's property owner via Tracerfy API.
 * Body: { permitId: string }
 *
 * Sends address + owner name to Tracerfy, stores result on the permit.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTier, isAtSkipTraceLimit } from "@/lib/tiers";

export const dynamic = "force-dynamic";

const TRACERFY_TOKEN = process.env.TRACERFY_API_KEY || "";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get profile and check limits
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const tier = getUserTier(profile);

  if (isAtSkipTraceLimit(tier, profile?.skip_traces_used || 0)) {
    return NextResponse.json({
      error: "Skip trace limit reached",
      limit: tier.skipTraceLimit,
      used: profile?.skip_traces_used || 0,
    }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const { permitId } = body as { permitId?: string };

  if (!permitId) return NextResponse.json({ error: "permitId required" }, { status: 400 });

  // Get the permit
  const { data: permit } = await admin.from("permits").select("*").eq("id", permitId).single();
  if (!permit) return NextResponse.json({ error: "Permit not found" }, { status: 404 });

  // Check if we already have skip trace data
  if (permit.skip_trace_data && Object.keys(permit.skip_trace_data).length > 0) {
    return NextResponse.json({ ok: true, cached: true, data: permit.skip_trace_data });
  }

  if (!TRACERFY_TOKEN) {
    return NextResponse.json({ error: "Skip trace API not configured" }, { status: 500 });
  }

  // Build CSV for Tracerfy
  const ownerName = permit.applicant_name || "";
  const nameParts = ownerName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";
  const address = permit.address || "";
  const city = permit.city || "";
  const state = permit.state || "";
  const zip = permit.zip_code || "";

  if (!address || (!firstName && !lastName)) {
    return NextResponse.json({
      error: "Insufficient data for skip trace — need at least an address and owner name",
      permit: { address, owner: ownerName },
    }, { status: 422 });
  }

  try {
    // Create CSV content
    const csvContent = `first_name,last_name,address,city,state,zip\n${firstName},${lastName},"${address}",${city},${state},${zip}`;
    const blob = new Blob([csvContent], { type: "text/csv" });

    const formData = new FormData();
    formData.append("csv_file", blob, "trace.csv");
    formData.append("first_name_column", "first_name");
    formData.append("last_name_column", "last_name");
    formData.append("address_column", "address");
    formData.append("city_column", "city");
    formData.append("state_column", "state");
    formData.append("mail_address_column", "address");

    const res = await fetch("https://tracerfy.com/v1/api/trace/", {
      method: "POST",
      headers: { Authorization: `Bearer ${TRACERFY_TOKEN}` },
      body: formData,
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("[skip-trace] Tracerfy error:", result);
      return NextResponse.json({ error: "Tracerfy API error", details: result }, { status: 502 });
    }

    // Store the queue ID on the permit for later retrieval
    const skipTraceData = {
      queue_id: result.queue_id || result.id,
      status: "pending",
      submitted_at: new Date().toISOString(),
      owner_name: ownerName,
      address: `${address}, ${city}, ${state} ${zip}`,
    };

    await admin.from("permits").update({ skip_trace_data: skipTraceData }).eq("id", permitId);

    // Increment skip trace usage
    await admin.from("profiles").update({
      skip_traces_used: (profile?.skip_traces_used || 0) + 1,
    }).eq("id", user.id);

    return NextResponse.json({ ok: true, data: skipTraceData });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[skip-trace] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
