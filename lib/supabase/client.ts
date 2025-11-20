"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
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
let browserClient: TypedSupabaseClient | null = null;

export function getSupabaseBrowserClient(): TypedSupabaseClient {
  if (browserClient) return browserClient;
  const { supabaseKey, supabaseUrl } = getSupabaseEnv();
  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return browserClient;
}
