import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get profile (don't require onboarding — just load what we have)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If no profile yet, create a basic one
  if (!profile) {
    await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email,
      company_name: "",
      industry: "",
    });
  }

  // Fetch ALL permits — no zip filter, ordered by most recent, limit 500
  const { data: permits } = await supabase
    .from("permits")
    .select("*")
    .order("filed_date", { ascending: false })
    .limit(500);

  // Get user's starred/viewed permits
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
      profile={profile || { company_name: "" }}
      permits={permits || []}
      viewsMap={viewsMap}
    />
  );
}
