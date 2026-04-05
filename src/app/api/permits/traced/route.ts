/**
 * GET /api/permits/traced
 * Returns permits that the CURRENT USER has skip traced.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Get permit IDs that this user has traced
  const { data: views } = await admin
    .from("permit_views")
    .select("permit_id")
    .eq("user_id", user.id)
    .eq("traced", true)
    .order("traced_at", { ascending: false });

  if (!views || views.length === 0) {
    return NextResponse.json({ permits: [] });
  }

  const permitIds = views.map((v) => v.permit_id);

  // Fetch those permits with their skip trace data
  const { data: permits, error } = await admin
    .from("permits")
    .select("*")
    .in("id", permitIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort by the order from permit_views (most recently traced first)
  const orderMap = new Map(permitIds.map((id, i) => [id, i]));
  const sorted = (permits || []).sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));

  return NextResponse.json({ permits: sorted });
}
