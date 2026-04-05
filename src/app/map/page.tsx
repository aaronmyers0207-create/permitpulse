import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MapClient from "./MapClient";

export default async function MapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/onboarding/company");

  return <MapClient profile={profile} />;
}
