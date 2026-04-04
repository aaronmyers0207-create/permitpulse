import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile?.onboarding_complete) redirect("/onboarding/company");

  const { data: territories } = await supabase.from("territories").select("*").eq("user_id", user.id).eq("active", true);

  const zipCodes = territories?.map((t) => t.zip_code) || [];

  let permits: any[] = [];
  if (zipCodes.length > 0) {
    const { data } = await supabase.from("permits").select("*").in("zip_code", zipCodes).order("filed_date", { ascending: false }).limit(100);
    permits = data || [];
  }

  const { data: views } = await supabase.from("permit_views").select("permit_id, starred, notes").eq("user_id", user.id);

  const viewsMap: Record<string, { starred: boolean; notes: string | null }> = {};
  views?.forEach((v) => { viewsMap[v.permit_id] = { starred: v.starred, notes: v.notes }; });

  return <DashboardClient profile={profile} permits={permits} territories={territories || []} viewsMap={viewsMap} />;
}
