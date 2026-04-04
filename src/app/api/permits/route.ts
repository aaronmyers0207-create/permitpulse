/**
 * GET /api/permits?page=1&limit=50&category=hvac&state=TX&q=search&mode=new|replacement|upsell&upsell_category=roofing
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/tiers";
import { getReplacementDateRange, getUpsellDateRange, type UpsellOpportunity } from "@/lib/prospecting";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("tier, states").eq("id", user.id).single();
  const tier = getUserTier(profile);

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const requestedLimit = Math.min(100, Math.max(1, parseInt(params.get("limit") || "50", 10)));
  const category = params.get("category") || "";
  const state = params.get("state") || "";
  const search = params.get("q") || "";
  const statesParam = params.get("states") || "";
  const mode = params.get("mode") || "new";
  const upsellCategory = params.get("upsell_category") || "";
  const upsellMinAge = parseInt(params.get("upsell_min_age") || "0", 10);
  const upsellMaxAge = parseInt(params.get("upsell_max_age") || "3", 10);

  const maxPermits = tier.permitLimit || 999999;
  const limit = Math.min(requestedLimit, maxPermits);
  const maxPage = Math.ceil(maxPermits / limit);
  const effectivePage = Math.min(page, maxPage);
  const from = (effectivePage - 1) * limit;
  const to = Math.min(from + limit - 1, maxPermits - 1);

  if (from >= maxPermits) {
    return NextResponse.json({ permits: [], total: maxPermits, page: effectivePage, limit, totalPages: maxPage, tierLimited: true, tierName: tier.name });
  }

  let query = supabase.from("permits").select("*", { count: "exact" });

  // State filter
  if (state) {
    query = query.eq("state", state);
  } else if (statesParam) {
    const stateList = statesParam.split(",").filter(Boolean);
    if (stateList.length > 0) query = query.in("state", stateList);
  }

  // Search
  if (search) {
    query = query.or(`address.ilike.%${search}%,contractor_name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Mode-specific logic
  if (mode === "replacement" && category) {
    query = query.eq("category", category);
    const range = getReplacementDateRange(category);
    if (range) query = query.gte("filed_date", range.from).lte("filed_date", range.to);
    query = query.order("filed_date", { ascending: true });
  } else if (mode === "upsell" && upsellCategory) {
    // Look for permits in a DIFFERENT category that signal an upsell opportunity
    query = query.eq("category", upsellCategory);
    const now = new Date();
    const fromDate = `${now.getFullYear() - upsellMaxAge}-01-01`;
    const toDate = `${now.getFullYear() - upsellMinAge}-12-31`;
    query = query.gte("filed_date", fromDate).lte("filed_date", toDate);
    query = query.order("filed_date", { ascending: false });
  } else {
    // New permits mode — show everything, most recent first
    if (category) query = query.eq("category", category);
    query = query.order("filed_date", { ascending: false });
  }

  const { data: permits, count, error } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const actualTotal = count || 0;
  const cappedTotal = tier.permitLimit > 0 ? Math.min(actualTotal, maxPermits) : actualTotal;

  return NextResponse.json({
    permits: permits || [], total: cappedTotal, page: effectivePage, limit,
    totalPages: Math.ceil(cappedTotal / limit),
    tierLimited: tier.permitLimit > 0 && actualTotal > maxPermits,
    tierName: tier.name, actualTotal,
  });
}
