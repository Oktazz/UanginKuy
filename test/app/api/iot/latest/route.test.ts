import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  checkRateLimit: vi.fn(),
  redisGet: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({}) }));
vi.mock("@/utils/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/utils/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/utils/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/redis", () => ({ redis: { get: mocks.redisGet } }));

import { GET } from "@/app/api/iot/latest/route";

describe("GET /api/iot/latest - Kurir vs Loket IoT Scale Assignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true });
    mocks.redisGet.mockResolvedValue(null);
  });

  it("Kasus 1 (Kurir): Kurir Senada hanya membaca timbangan yang ditugaskan kepadanya (SCALE-001)", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "courier-senada-id" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: "kurir" },
              error: null,
            }),
          })),
        })),
      })),
    });

    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn((col, val) => {
            expect(col).toBe("assigned_courier_id");
            expect(val).toBe("courier-senada-id");
            return {
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "SCALE-001", last_weight: 4.5, last_measurement_at: "2026-09-17T09:00:00Z" },
                error: null,
              }),
            };
          }),
        })),
      })),
    });

    const req = new NextRequest("http://localhost/api/iot/latest");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.deviceId).toBe("SCALE-001");
    expect(json.data.weight).toBe(4.5);
  });

  it("Kasus 2 (Loket - Ada timbangan khusus): Admin membaca timbangan loket yang unassigned (SCALE-LOKET)", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-loket-id" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: "admin" },
              error: null,
            }),
          })),
        })),
      })),
    });

    // Mock query chain: .is("assigned_courier_id", null).order(...).limit(...).maybeSingle()
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "SCALE-LOKET", last_weight: 12.8, last_measurement_at: "2026-09-17T09:15:00Z" },
      error: null,
    });
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockIs = vi.fn((col, val) => {
      expect(col).toBe("assigned_courier_id");
      expect(val).toBeNull();
      return { order: mockOrder };
    });

    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          is: mockIs,
        })),
      })),
    });

    const req = new NextRequest("http://localhost/api/iot/latest");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.deviceId).toBe("SCALE-LOKET");
    expect(json.data.weight).toBe(12.8);
    expect(mockIs).toHaveBeenCalledWith("assigned_courier_id", null);
  });

  it("Kasus 3 (Loket - Hanya ada 1 timbangan): Admin fallback ke timbangan yang aktif (SCALE-001) jika belum ada timbangan unassigned", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-loket-id" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: "admin" },
              error: null,
            }),
          })),
        })),
      })),
    });

    // Unassigned query returns null, then fallback query returns SCALE-001
    const mockUnassignedMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockFallbackMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "SCALE-001", last_weight: 3.5, last_measurement_at: "2026-09-17T09:20:00Z" },
      error: null,
    });

    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          is: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: mockUnassignedMaybeSingle,
              })),
            })),
          })),
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: mockFallbackMaybeSingle,
            })),
          })),
        })),
      })),
    });

    const req = new NextRequest("http://localhost/api/iot/latest");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.deviceId).toBe("SCALE-001");
    expect(json.data.weight).toBe(3.5);
  });

  it("Kasus 4 (Loket - Meminta ID Spesifik): Admin dapat meminta deviceId tertentu lewat query param ?deviceId=SCALE-001", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-loket-id" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: "admin" },
              error: null,
            }),
          })),
        })),
      })),
    });

    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn((col, val) => {
            expect(col).toBe("id");
            expect(val).toBe("SCALE-001");
            return {
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "SCALE-001", last_weight: 8.0, last_measurement_at: "2026-09-17T09:35:00Z" },
                error: null,
              }),
            };
          }),
        })),
      })),
    });

    const req = new NextRequest("http://localhost/api/iot/latest?deviceId=SCALE-001");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.deviceId).toBe("SCALE-001");
    expect(json.data.weight).toBe(8.0);
  });

  it("Kasus 5 (Keamanan): Nasabah tidak diizinkan mengakses endpoint IoT", async () => {
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "nasabah-1" } },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: "nasabah" },
              error: null,
            }),
          })),
        })),
      })),
    });

    const req = new NextRequest("http://localhost/api/iot/latest");
    const res = await GET(req);

    expect(res.status).toBe(403);
  });
});
