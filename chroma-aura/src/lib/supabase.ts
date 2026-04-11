import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Chroma Aura DB Schema (PostgreSQL)
 * 
 * users (id, email, tier, credits)
 * projects (id, user_id, device_id, title, canvas_state, created_at)
 * prompts (id, project_id, content, status, result_url)
 * quotas (id, device_id, user_id, drawing_used, generation_used, last_reset)
 */
