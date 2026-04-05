/**
 * GET /api/permits/traced
 * Returns permits that have been skip traced (have results).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Use admin client since skip_trace_data was written by service role
  const admin = createAdminClient();

  const { data: permits, error } = await admin
    .from("permits")
    .select("*")
    .not("skip_trace_data", "eq", "{}")
    .not("skip_trace_data", "is", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ permits: permits || [] });
}
