import { createClient } from "@supabase/supabase-js";

// REPLACE THESE VALUES WITH YOUR OWN SUPABASE PROJECT DETAILS
// You can find these in your Supabase Project Settings > API
const SUPABASE_URL = "https://vhywgrmgjmrbvfjdpixx.supabase.co/rest/v1/";
const SUPABASE_PUBLIC_KEY = "sb_publishable_wid6U_SFWEgJRLRYG8oDrg__eefkv-l";

/**
 * Supabase client for project interaction.
 * Ensure you have installed the client using: npm install @supabase/supabase-js
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
