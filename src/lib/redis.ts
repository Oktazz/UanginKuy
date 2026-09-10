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

const INCR_WINDOW_SCRIPT = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return count
`;

/**
 * Atomic sliding-window counter using INCR + conditional EXPIRE in a single
 * Lua script. Replaces the racy `incr` + `expire` pattern that could leave
 * orphaned keys without TTL (memory leak) or skip the window reset.
 * @returns number of calls within the window since first call
 */
export async function incrWindow(key: string, windowSeconds: number): Promise<number> {
  try {
    return await redis.eval<[string], number>(
      INCR_WINDOW_SCRIPT,
      [key],
      [String(windowSeconds)],
    );
  } catch (error) {
    console.warn(`[RateLimit] incrWindow unavailable for key ${key}`, {
      reason: error instanceof Error ? error.name : "unknown_error",
    });
    return 0;
  }
}

/**
 * Cache-aside helper. Falls back to the producer on any cache error so a
 * Redis outage never blocks reads.
 * @param shouldCache skip persisting the result (e.g. error payloads)
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  producer: () => Promise<T>,
  shouldCache: (value: T) => boolean = () => true,
): Promise<T> {
  const hit = await redis.get<T>(key).catch(() => null);
  if (hit !== null) return hit;

  const value = await producer();
  if (shouldCache(value)) {
    await redis.setex(key, ttlSeconds, value).catch(() => null);
  }
  return value;
}
