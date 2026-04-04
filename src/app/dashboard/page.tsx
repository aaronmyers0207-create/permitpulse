import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { getUserTier } from "@/lib/tiers";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      company_name: "",
      industry: "",
    });
    redirect("/onboarding/company");
  }

  const tier = getUserTier(profile);
  const PAGE_SIZE = 50;

  // Build query — new permits from last 2 years, ordered recent first
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  let query = supabase
    .from("permits")
    .select("*", { count: "exact" })
    .gte("filed_date", twoYearsAgo.toISOString().split("T")[0])
    .order("filed_date", { ascending: false });

  // Filter by user's states
  const states = profile.states as string[] | null;
  if (states && states.length > 0 && states.length < 9) {
    query = query.in("state", states);
  }

  // Enforce tier limit
  const maxPermits = tier.permitLimit || 999999;
  const effectiveLimit = Math.min(PAGE_SIZE, maxPermits);

  const { data: permits, count } = await query.range(0, effectiveLimit - 1);
  const cappedTotal = tier.permitLimit > 0 ? Math.min(count || 0, maxPermits) : (count || 0);

  // Get starred permits
  const { data: views } = await supabase
    .from("permit_views")
    .select("permit_id, starred, notes")
    .eq("user_id", user.id);

  const viewsMap: Record<string, { starred: boolean; notes: string | null }> = {};
  views?.forEach((v) => {
    viewsMap[v.permit_id] = { starred: v.starred, notes: v.notes };
  });

  return (
    <DashboardClient
      profile={profile}
      initialPermits={permits || []}
      totalCount={cappedTotal}
      pageSize={PAGE_SIZE}
      viewsMap={viewsMap}
    />
  );
}
