import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

function getServiceEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  }
  return { supabaseUrl, serviceKey };
}

type TypedSupabaseClient = SupabaseClient<Database>;

export function createSupabaseAdminClient(): TypedSupabaseClient {
  const { supabaseUrl, serviceKey } = getServiceEnv();
  return createClient<Database>(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
