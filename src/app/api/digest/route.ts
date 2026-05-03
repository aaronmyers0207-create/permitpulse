/**
 * GET /api/digest
 * Daily digest email endpoint.
 * Requires header: x-digest-secret: permittracer_digest_2026
 *
 * Returns JSON with email content for each user (SendGrid integration ready).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { DigestEmailTemplate, getDigestSubject, type TopLead } from "@/components/DigestEmailTemplate";

export const dynamic = "force-dynamic";

const DIGEST_SECRET = "permittracer_digest_2026";

const SUPABASE_URL = "https://avhkzrorpcweqvnvmksx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aGt6cm9ycGN3ZXF2bnZta3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjM1MDIsImV4cCI6MjA5MDg5OTUwMn0.xnVsG_nlLT2FdyKsfUvIG6hDJ_JPkF5N5HMC9vDNe5Y";

export async function GET(request: NextRequest) {
  // 1. Validate secret header
  const secret = request.headers.get("x-digest-secret");
  if (secret !== DIGEST_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized — missing or invalid x-digest-secret header" },
      { status: 401 }
    );
  }

  // Use service role if available, fall back to anon key
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 2. Query profiles with email + at least one state
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, company_name, industry, states")
    .not("email", "is", null)
    .not("states", "is", null);

  if (profilesError) {
    return NextResponse.json(
      { error: "Failed to fetch profiles", details: profilesError.message },
      { status: 500 }
    );
  }

  // Filter profiles that have at least one state (array_length > 0)
  const eligibleProfiles = (profiles || []).filter(
    (p) => Array.isArray(p.states) && p.states.length > 0 && p.email
  );

  if (eligibleProfiles.length === 0) {
    return NextResponse.json({ sent: 0, users: [] });
  }

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const results: Array<{
    email: string;
    company_name?: string;
    permit_count: number;
    states: string[];
    subject: string;
    html: string;
    top_leads: TopLead[];
  }> = [];

  for (const profile of eligibleProfiles) {
    const states: string[] = profile.states;

    // 3a. Count permits in last 24h in user's states
    const { count: permitCount } = await supabase
      .from("permits")
      .select("id", { count: "exact", head: true })
      .in("state", states)
      .gte("created_at", last24h);

    // 3b. Top 3 hottest permits in last 7 days in user's states
    const { data: topPermits } = await supabase
      .from("permits")
      .select(
        "id, address, city, state, category, permit_type, estimated_value, filed_date, description"
      )
      .in("state", states)
      .gte("filed_date", last7d.split("T")[0]) // filed_date is likely a date column
      .order("estimated_value", { ascending: false, nullsFirst: false })
      .order("filed_date", { ascending: false })
      .limit(3);

    const topLeads: TopLead[] = (topPermits || []).map((p) => ({
      id: p.id,
      address: p.address,
      city: p.city,
      state: p.state,
      category: p.category,
      permit_type: p.permit_type,
      estimated_value: p.estimated_value,
      filed_date: p.filed_date,
      description: p.description,
    }));

    const count = permitCount || 0;

    // 4. Build HTML email
    const html = DigestEmailTemplate({
      email: profile.email,
      companyName: profile.company_name,
      permitCount: count,
      states,
      topLeads,
    });

    const subject = getDigestSubject(count);

    results.push({
      email: profile.email,
      company_name: profile.company_name,
      permit_count: count,
      states,
      subject,
      html,
      top_leads: topLeads,
    });
  }

  // 5. Return digest data (SendGrid integration point)
  // When SendGrid is hooked up, replace this with actual send calls:
  // await sendGridClient.send({ to: result.email, subject: result.subject, html: result.html })
  return NextResponse.json({
    sent: results.length,
    generated_at: now.toISOString(),
    users: results.map(({ email, company_name, permit_count, states, subject, top_leads }) => ({
      email,
      company_name,
      permit_count,
      states,
      subject,
      top_leads,
      // html is omitted from summary to keep response lean
      // Include it if you need to preview: uncomment below
      // html,
    })),
    // Full email HTML objects for SendGrid integration:
    emails: results.map(({ email, subject, html }) => ({ to: email, subject, html })),
  });
}
