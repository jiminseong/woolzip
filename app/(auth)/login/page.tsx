import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getSession } from "@/lib/supabase/server";

export default async function LoginPage() {
  const { session } = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="section">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">울집 🏠</h1>
          <p className="text-token-text-secondary">하루 10초, 우리 가족 안심</p>
        </div>
      </header>
      <main className="flex-1 px-4 pb-16 flex items-start">
        <LoginForm />
      </main>
    </div>
  );
}
