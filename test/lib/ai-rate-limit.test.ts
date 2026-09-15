import { beforeEach, describe, expect, it, vi } from "vitest";

const { incrWindowMock, ttlMock } = vi.hoisted(() => ({
  incrWindowMock: vi.fn(),
  ttlMock: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  incrWindow: incrWindowMock,
  redis: {
    ttl: ttlMock,
  },
}));

import { checkAiRateLimit, checkLandingAiRateLimit } from "@/lib/ai-rate-limit";

describe("AI rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    ttlMock.mockResolvedValue(42);
  });

  it("allows requests and leaves remaining count", async () => {
    incrWindowMock.mockResolvedValue(1);

    await expect(checkAiRateLimit("user-1")).resolves.toEqual({ allowed: true, remaining: 9 });
    expect(incrWindowMock).toHaveBeenCalledWith("ai-chat:rate:user-1", 60);
  });

  it("blocks requests above the limit", async () => {
    incrWindowMock.mockResolvedValue(11);

    await expect(checkAiRateLimit("user-1")).resolves.toEqual({ allowed: false, retryAfter: 42 });
  });

  it("fails open outside production when Redis is unavailable", async () => {
    incrWindowMock.mockRejectedValue(new Error("redis unavailable"));

    await expect(checkAiRateLimit("user-1")).resolves.toEqual({ allowed: true, remaining: 10 });
  });

  it("checks landing ai rate limit using IP key", async () => {
    incrWindowMock.mockResolvedValue(3);

    await expect(checkLandingAiRateLimit("192.168.1.1")).resolves.toEqual({ allowed: true, remaining: 7 });
    expect(incrWindowMock).toHaveBeenCalledWith("ai-landing:rate:192.168.1.1", 60);
  });
});