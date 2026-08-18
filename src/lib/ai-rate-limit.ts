import { redis } from "@/lib/redis";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;
const MAX_SORT_REQUESTS = 5;

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfter: number };

async function checkRateLimit(
  key: string,
  maxRequests: number,
  logContext: string,
): Promise<RateLimitResult> {

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SECONDS);

    if (count > maxRequests) {
      const ttl = await redis.ttl(key);
      return { allowed: false, retryAfter: Math.max(ttl, 1) };
    }

    return { allowed: true, remaining: Math.max(maxRequests - count, 0) };
  } catch (error) {
    console.warn(`[${logContext}] Rate limiter unavailable`, {
      reason: error instanceof Error ? error.name : "unknown_error",
      environment: process.env.NODE_ENV,
    });

    if (process.env.NODE_ENV === "production") {
      return { allowed: false, retryAfter: 30 };
    }

    return { allowed: true, remaining: maxRequests };
  }
}

export function checkAiRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(`ai-chat:rate:${userId}`, MAX_REQUESTS, "AI Chat");
}

export function checkAiSortRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(`ai-sort:rate:${userId}`, MAX_SORT_REQUESTS, "AI Sort");
}
