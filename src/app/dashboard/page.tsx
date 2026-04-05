import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { getUserTier } from "@/lib/tiers";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) {
    // Create profile — use admin client to bypass RLS for initial creation
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin.from("profiles").upsert({ id: user.id, email: user.email, company_name: "", industry: "", tier: "free" });
    redirect("/onboarding/company");
  }

  // If onboarding isn't complete, redirect (skip for admin)
  const needsOnboarding = !profile.company_name || !profile.industry;
  if (needsOnboarding && profile.tier !== "admin") {
    redirect("/onboarding/company");
  }

  const tier = getUserTier(profile);
  const PAGE_SIZE = 50;

  // Main query
  let query = supabase.from("permits").select("*", { count: "exact" }).order("filed_date", { ascending: false });
  const states = profile.states as string[] | null;
  if (states && states.length > 0 && states.length < 9) query = query.in("state", states);
  const maxPermits = tier.permitLimit || 999999;
  const effectiveLimit = Math.min(PAGE_SIZE, maxPermits);
  const { data: permits, count } = await query.range(0, effectiveLimit - 1);
  const cappedTotal = tier.permitLimit > 0 ? Math.min(count || 0, maxPermits) : (count || 0);

  // What's new since last visit
  const lastVisit = profile.last_dashboard_visit || new Date(Date.now() - 86400000).toISOString();
  let newQuery = supabase.from("permits").select("category", { count: "exact" })
    .gte("filed_date", lastVisit.split("T")[0]);
  if (states && states.length > 0 && states.length < 9) newQuery = newQuery.in("state", states);
  const { count: newCount } = await newQuery;

  // Update last visit
  await supabase.from("profiles").update({ last_dashboard_visit: new Date().toISOString() }).eq("id", user.id);

  // Starred/viewed permits with status
  const { data: views } = await supabase.from("permit_views").select("permit_id, starred, notes, status").eq("user_id", user.id);
  const viewsMap: Record<string, { starred: boolean; notes: string | null; status: string }> = {};
  views?.forEach((v) => { viewsMap[v.permit_id] = { starred: v.starred, notes: v.notes, status: v.status || "new" }; });

  return (
    <DashboardClient
      profile={profile}
      initialPermits={permits || []}
      totalCount={cappedTotal}
      pageSize={PAGE_SIZE}
      viewsMap={viewsMap}
      newSinceLastVisit={newCount || 0}
    />
  );
}
