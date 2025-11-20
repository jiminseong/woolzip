// 데이터베이스 연결 및 테이블 생성 테스트
// Supabase MCP를 통해 실행할 수 있는 스크립트

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

async function testConnection() {
  console.log("🔍 Testing Supabase connection...");

  try {
    // 기본 연결 테스트
    const { data, error } = await supabase.from("users").select("count").limit(1);

    if (error) {
      console.log("❌ Connection test failed - this is expected if tables don't exist yet");
      console.log("Error:", error.message);
      return false;
    }

    console.log("✅ Database connection successful!");
    return true;
  } catch (err) {
    console.log("❌ Connection failed:", err);
    return false;
  }
}

async function createBasicSchema() {
  console.log("🛠️  Creating basic schema...");

  // 기본 users 테이블부터 생성
  const createUsersTable = `
    create table if not exists public.users (
      id uuid primary key default auth.uid(),
      email text unique,
      display_name text,
      avatar_url text,
      locale text default 'ko-KR',
      created_at timestamptz default now()
    );
    
    alter table public.users enable row level security;
    
    create policy "Users can view own profile" on public.users
      for select using (auth.uid() = id);
      
    create policy "Users can update own profile" on public.users
      for update using (auth.uid() = id);
      
    create policy "Users can insert own profile" on public.users
      for insert with check (auth.uid() = id);
  `;

  try {
    const { error } = await supabase.rpc("exec_sql", { sql_query: createUsersTable });

    if (error) {
      console.log("❌ Failed to create users table:", error);
      return false;
    }

    console.log("✅ Users table created successfully!");
    return true;
  } catch (err) {
    console.log("❌ Schema creation failed:", err);
    return false;
  }
}

// 실행
testConnection()
  .then((success) => {
    if (!success) {
      console.log("🚀 Attempting to create initial schema...");
      return createBasicSchema();
    }
    return true;
  })
  .then((success) => {
    if (success) {
      console.log("🎉 Database setup complete!");
    } else {
      console.log("💡 Manual schema setup may be required via Supabase dashboard");
    }
  })
  .catch(console.error);
