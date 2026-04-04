/**
 * POST /api/permit-status
 * Update a permit's lead status and/or notes.
 * Body: { permitId: string, status?: string, notes?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { permitId, status, notes } = body as { permitId?: string; status?: string; notes?: string };

  if (!permitId) return NextResponse.json({ error: "permitId required" }, { status: 400 });

  const update: any = { user_id: user.id, permit_id: permitId, viewed_at: new Date().toISOString() };
  if (status !== undefined) update.status = status;
  if (notes !== undefined) update.notes = notes;

  const { error } = await supabase.from("permit_views").upsert(update, { onConflict: "user_id,permit_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
