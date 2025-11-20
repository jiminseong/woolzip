#!/usr/bin/env node

// Woolzip Database Setup Script
// Supabase 프로젝트에 스키마를 자동으로 생성하는 스크립트

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function runSQL(filename) {
  try {
    const sql = readFileSync(join(process.cwd(), "scripts", filename), "utf-8");
    console.log(`🔄 Executing ${filename}...`);

    const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

    if (error) {
      console.error(`❌ Error in ${filename}:`, error);
      return false;
    }

    console.log(`✅ Successfully executed ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to read/execute ${filename}:`, err.message);
    return false;
  }
}

async function setupDatabase() {
  console.log("🚀 Setting up Woolzip database schema...");

  // First create the schema
  const schemaSuccess = await runSQL("init-schema.sql");
  if (!schemaSuccess) {
    console.error("❌ Failed to create schema");
    process.exit(1);
  }

  // Then apply RLS policies
  const rlsSuccess = await runSQL("rls-policies.sql");
  if (!rlsSuccess) {
    console.error("❌ Failed to apply RLS policies");
    process.exit(1);
  }

  console.log("🎉 Database setup complete!");
}

setupDatabase().catch(console.error);
