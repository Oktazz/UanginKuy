import { NextRequest } from "next/server";
import { incrWindow } from "@/lib/redis";

export type RateLimitDecision =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfter: number };

/**
 * Ekstrak IP client dengan aman dari proxy headers.
 */
export function requestClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Rate limit berbasis key (userId / deviceId / ip) dengan counter atomik
 * (Lua INCR + EXPIRE). Redis down → fail-open (count 0) agar tak memblokir takwajar.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSeconds = 60,
): Promise<RateLimitDecision> {
  const count = await incrWindow(key, windowSeconds);

  if (count > max) {
    return { allowed: false, retryAfter: windowSeconds };
  }

  return { allowed: true, remaining: Math.max(max - count, 0) };
}