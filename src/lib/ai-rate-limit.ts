import { redis } from "@/lib/redis";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfter: number };

export async function checkAiRateLimit(userId: string): Promise<RateLimitResult> {
  const key = `ai-chat:rate:${userId}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_SECONDS);

    if (count > MAX_REQUESTS) {
      const ttl = await redis.ttl(key);
      return { allowed: false, retryAfter: Math.max(ttl, 1) };
    }

    return { allowed: true, remaining: Math.max(MAX_REQUESTS - count, 0) };
  } catch (error) {
    console.warn("[AI Chat] Rate limiter unavailable", {
      reason: error instanceof Error ? error.name : "unknown_error",
      environment: process.env.NODE_ENV,
    });

    if (process.env.NODE_ENV === "production") {
      return { allowed: false, retryAfter: 30 };
    }

    return { allowed: true, remaining: MAX_REQUESTS };
  }
}
