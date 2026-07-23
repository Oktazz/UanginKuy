import { Redis } from '@upstash/redis';
import { revalidatePath } from 'next/cache';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Throw an error early if not configured correctly, although you may want graceful fallback for development.
if (!redisUrl || !redisToken) {
  console.warn("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not defined in the environment. Redis client might fail.");
}

export const redis = new Redis({
  url: redisUrl || '',
  token: redisToken || '',
});

/**
 * Dual Invalidation: Clears the redis cache and Next.js full route cache
 * @param redisKey The Redis key to delete
 * @param nextPath The Next.js path to revalidate
 */
export async function invalidateCacheAndPath(redisKey: string, nextPath: string) {
  try {
    await redis.del(redisKey);
    console.log(`[Cache] Cleared Redis key: ${redisKey}`);
  } catch (error) {
    console.error(`[Cache Error] Failed to delete Redis key ${redisKey}:`, error);
  }

  // Tell Next.js to re-render the page
  revalidatePath(nextPath);
}
