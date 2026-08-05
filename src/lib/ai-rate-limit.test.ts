import { beforeEach, describe, expect, it, vi } from "vitest";

const { incrMock, expireMock, ttlMock } = vi.hoisted(() => ({
  incrMock: vi.fn(),
  expireMock: vi.fn(),
  ttlMock: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    incr: incrMock,
    expire: expireMock,
    ttl: ttlMock,
  },
}));

import { checkAiRateLimit } from "./ai-rate-limit";

describe("AI rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    expireMock.mockResolvedValue(true);
    ttlMock.mockResolvedValue(42);
  });

  it("allows requests and sets the window on the first request", async () => {
    incrMock.mockResolvedValue(1);

    await expect(checkAiRateLimit("user-1")).resolves.toEqual({ allowed: true, remaining: 9 });
    expect(expireMock).toHaveBeenCalledWith("ai-chat:rate:user-1", 60);
  });

  it("blocks requests above the limit", async () => {
    incrMock.mockResolvedValue(11);

    await expect(checkAiRateLimit("user-1")).resolves.toEqual({ allowed: false, retryAfter: 42 });
  });

  it("fails open outside production when Redis is unavailable", async () => {
    incrMock.mockRejectedValue(new Error("redis unavailable"));

    await expect(checkAiRateLimit("user-1")).resolves.toEqual({ allowed: true, remaining: 10 });
  });
});
