import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function getActiveSchedules() {
  const supabase = await createClient(await cookies());

  // Fetch active schedules where operational date is >= today
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('is_active', true)
    .gte('operational_date', today)
    .order('operational_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch schedules: ${error.message}`);
  }

  return data;
}
