/**
 * POST /api/skip-trace
 * Skip trace a permit's property owner via Tracerfy API.
 * Submits the trace, polls for results, returns contact data.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTier, isAtSkipTraceLimit } from "@/lib/tiers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TRACERFY_TOKEN = process.env.TRACERFY_API_KEY || "";

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

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
  if (permit.skip_trace_data?.phones || permit.skip_trace_data?.emails) {
    return NextResponse.json({ ok: true, cached: true, data: permit.skip_trace_data });
  }

  if (!TRACERFY_TOKEN) return NextResponse.json({ error: "Skip trace API not configured" }, { status: 500 });

  const ownerName = permit.applicant_name || "";
  const nameParts = ownerName.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  const address = permit.address || "";
  const city = permit.city || "";
  const state = permit.state || "";
  const zip = permit.zip_code || "";

  if (!address) return NextResponse.json({ error: "No address available for skip trace" }, { status: 422 });

  // Tracerfy traces by address — owner name is optional
  // If no name, send empty first/last and let Tracerfy resolve by address

  try {
    // Step 1: Submit to Tracerfy
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
    formData.append("mail_city_column", "city");
    formData.append("mail_state_column", "state");

    const submitRes = await fetch("https://tracerfy.com/v1/api/trace/", {
      method: "POST",
      headers: { Authorization: `Bearer ${TRACERFY_TOKEN}` },
      body: formData,
    });

    const submitResult = await submitRes.json();
    if (!submitRes.ok) {
      return NextResponse.json({ error: "Tracerfy API error", details: submitResult }, { status: 502 });
    }

    const queueId = submitResult.queue_id;

    // Step 2: Poll for completion (up to 45 seconds)
    let downloadUrl = "";
    for (let attempt = 0; attempt < 15; attempt++) {
      await sleep(3000);

      const pollRes = await fetch("https://tracerfy.com/v1/api/queues/", {
        headers: { Authorization: `Bearer ${TRACERFY_TOKEN}` },
      });
      const queues = await pollRes.json();

      if (Array.isArray(queues)) {
        const queue = queues.find((q: any) => q.id === queueId);
        if (queue && !queue.pending && queue.download_url) {
          downloadUrl = queue.download_url;
          break;
        }
      }
    }

    if (!downloadUrl) {
      // Save queue ID so we can check later
      const pendingData = { queue_id: queueId, status: "processing", submitted_at: new Date().toISOString() };
      await admin.from("permits").update({ skip_trace_data: pendingData }).eq("id", permitId);
      return NextResponse.json({ ok: true, data: pendingData, message: "Trace is processing — check back in a moment" });
    }

    // Step 3: Download and parse the CSV results
    const csvRes = await fetch(downloadUrl);
    const csvText = await csvRes.text();

    // Parse CSV
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
    const values = lines[1] ? lines[1].split(",").map((v) => v.replace(/"/g, "").trim()) : [];

    const result: Record<string, string> = {};
    headers.forEach((h, i) => { if (values[i]?.trim()) result[h] = values[i].trim(); });

    // Extract the contact data
    const skipTraceData: any = {
      status: "completed",
      queue_id: queueId,
      traced_at: new Date().toISOString(),
      owner_name: ownerName,
      address: `${address}, ${city}, ${state} ${zip}`.trim(),
      // Contact info from Tracerfy
      phones: [] as any[],
      emails: [] as string[],
      // Raw fields
      raw: result,
    };

    // Tracerfy returns phone_1, phone_2, etc. and email_1, email_2, etc.
    for (let i = 1; i <= 5; i++) {
      const phone = result[`phone_${i}`] || result[`Phone ${i}`] || result[`phone${i}`];
      const phoneType = result[`phone_${i}_type`] || result[`Phone ${i} Type`] || "";
      const phoneDnc = result[`phone_${i}_dnc`] || result[`Phone ${i} DNC`] || "";
      if (phone) {
        skipTraceData.phones.push({ number: phone, type: phoneType, dnc: phoneDnc });
      }
    }

    for (let i = 1; i <= 3; i++) {
      const email = result[`email_${i}`] || result[`Email ${i}`] || result[`email${i}`];
      if (email) skipTraceData.emails.push(email);
    }

    // Also check for common field names
    if (result.phone && !skipTraceData.phones.length) skipTraceData.phones.push({ number: result.phone, type: "", dnc: "" });
    if (result.email && !skipTraceData.emails.length) skipTraceData.emails.push(result.email);
    if (result.age) skipTraceData.age = result.age;
    if (result.mailing_address) skipTraceData.mailing_address = result.mailing_address;
    if (result.mailing_city) skipTraceData.mailing_city = result.mailing_city;
    if (result.mailing_state) skipTraceData.mailing_state = result.mailing_state;
    if (result.mailing_zip || result.mail_zip) skipTraceData.mailing_zip = result.mailing_zip || result.mail_zip;

    // Save to permit
    await admin.from("permits").update({ skip_trace_data: skipTraceData }).eq("id", permitId);

    // Increment usage
    await admin.from("profiles").update({ skip_traces_used: (profile?.skip_traces_used || 0) + 1 }).eq("id", user.id);

    return NextResponse.json({ ok: true, data: skipTraceData });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
