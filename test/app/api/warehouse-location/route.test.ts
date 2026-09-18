import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, getUserMock, createAdminClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getUserMock: vi.fn(),
  createAdminClientMock: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import { GET } from "@/app/api/warehouse-location/route";

describe("GET /api/warehouse-location", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    createClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
  });

  it("returns 401 if user is unauthenticated", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new Error("Unauthorized"),
    });

    const req = new NextRequest("http://localhost:3000/api/warehouse-location");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toBe("Sesi tidak valid. Silakan login kembali.");
  });

  it("returns warehouse location and dynamic operating hours from app_settings when available", async () => {
    const mockSettings = [
      {
        key: "warehouse_location",
        value: {
          latitude: -6.1754,
          longitude: 106.8272,
          address: "Jl. Medan Merdeka Barat No. 1",
          name: "Bank Sampah Pusat Merdeka",
        },
      },
      {
        key: "warehouse_operating_hours",
        value: {
          openTime: "07:30",
          closeTime: "15:30",
          daysLabel: "Senin - Jumat",
          notes: "Istirahat: 12.00 - 13.00",
          isActive: true,
        },
      },
    ];

    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
        }),
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/warehouse-location");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.latitude).toBe(-6.1754);
    expect(json.data.longitude).toBe(106.8272);
    expect(json.data.address).toBe("Jl. Medan Merdeka Barat No. 1");
    expect(json.data.name).toBe("Bank Sampah Pusat Merdeka");
    expect(json.data.operatingHours).toBe("07.30 - 15.30 WIB");
    expect(json.data.operatingDays).toBe("Senin - Jumat");
    expect(json.data.notes).toBe("Istirahat: 12.00 - 13.00");
    expect(json.data.isOpen).toBe(true);
    expect(json.data.isDefault).toBe(false);
  });

  it("returns default location fallback when setting does not exist", async () => {
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/warehouse-location");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.latitude).toBe(-6.2088);
    expect(json.data.longitude).toBe(106.8456);
    expect(json.data.operatingHours).toBe("08.00 - 16.00 WIB");
    expect(json.data.isDefault).toBe(true);
  });

  it("returns 500 when database error occurs", async () => {
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: null, error: { message: "DB failure" } }),
        }),
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/warehouse-location");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
