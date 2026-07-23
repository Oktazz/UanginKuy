import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export async function getActiveSchedules() {
  const cacheKey = 'schedules:active';

  try {
    // 1. Try fetching from Redis cache
    const cachedData = await redis.get<any[]>(cacheKey);
    if (cachedData) {
      console.log(`[Cache Hit] ${cacheKey}`);
      return cachedData;
    }
  } catch (error) {
    console.error(`[Cache Error] Failed to read ${cacheKey}:`, error);
  }

  // 2. Fallback to Supabase
  console.log(`[Cache Miss] ${cacheKey}, fetching from DB...`);
  const supabase = await createClient(await cookies());

  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch schedules: ${error.message}`);
  }

  try {
    // 3. Save to cache for 24 hours (86400 seconds) if data exists
    if (data) {
      await redis.setex(cacheKey, 86400, data);
    }
  } catch (error) {
    console.error(`[Cache Error] Failed to write ${cacheKey}:`, error);
  }

  return data;
}
