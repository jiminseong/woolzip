import { redirect } from "next/navigation";
import { createSupabaseServerClient, getSession } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const { session } = await getSession();

  if (!session) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();

  const { data: familyMember } = await (supabase.from("family_members") as any)
    .select("family_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (familyMember) {
    redirect("/");
  }

  const { data: profile } = await (supabase.from("users") as any)
    .select("display_name")
    .eq("id", session.user.id)
    .maybeSingle();

  const { data: settings } = await (supabase.from("settings") as any)
    .select("id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return (
    <OnboardingClient
      initialDisplayName={profile?.display_name ?? ""}
      hasProfile={Boolean(profile?.display_name)}
      hasSettings={Boolean(settings)}
    />
  );
}
