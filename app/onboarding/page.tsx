import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const { session } = await getSession();

  if (!session) {
    redirect("/login");
  }

  return <OnboardingClient />;
}
