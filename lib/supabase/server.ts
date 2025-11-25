import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "../database.types";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return { supabaseUrl, supabaseKey };
}

type TypedSupabaseClient = SupabaseClient<Database>;

export async function createSupabaseServerClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();
  const { supabaseKey, supabaseUrl } = getSupabaseEnv();
  const safeSet = (
    name: string,
    value: string,
    options?: Parameters<typeof cookieStore.set>[2]
  ) => {
    try {
      cookieStore.set(name, value, options);
    } catch {
      // In Server Components, Next.js disallows mutating cookies. Ignore set failures here.
    }
  };
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        safeSet(name, value, options);
      },
      remove(name, options) {
        safeSet(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}

export async function getSession(): Promise<{
  session: Session | null;
  supabase: TypedSupabaseClient;
}> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    const message = error.message?.toLowerCase?.() ?? "";
    if (message.includes("refresh token")) {
      // Invalid/expired refresh token: clear auth and treat as signed out
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error("supabase signOut after refresh error failed", signOutError);
      }
      return { session: null, supabase };
    }

    console.error("supabase getSession error", error);
    return { session: null, supabase };
  }
  return { session: data.session, supabase };
}
