import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get profile
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
  }

  // Only fetch the first page (50 rows) — client handles pagination
  const PAGE_SIZE = 50;
  const { data: permits, count } = await supabase
    .from("permits")
    .select("*", { count: "exact" })
    .order("filed_date", { ascending: false })
    .range(0, PAGE_SIZE - 1);

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
      initialPermits={permits || []}
      totalCount={count || 0}
      pageSize={PAGE_SIZE}
      viewsMap={viewsMap}
    />
  );
}
