import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use service role key to bypass RLS in trusted server environments
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const createAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase Service Role Key or URL. Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
