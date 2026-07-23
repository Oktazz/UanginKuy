import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pcqzoqqmrxarhjeduijo.supabase.co'; // derived from postgres url
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Wait, I don't know the service role key. I can just use raw SQL again!
