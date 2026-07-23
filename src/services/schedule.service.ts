import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function getActiveSchedules() {
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch schedules: ${error.message}`);
  }

  return data;
}
