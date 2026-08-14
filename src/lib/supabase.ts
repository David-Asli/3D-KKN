import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

if (supabaseUrl === 'https://dummy-url.supabase.co' || supabaseAnonKey === 'dummy-key') {
  console.warn("Supabase URL or Anon Key is missing. Check your .env.local file. Connected with dummy credentials.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
