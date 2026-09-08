import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "user-123";
const addressId = "addr-456";

// Mock Supabase
const { createClientMock, getUserMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: vi.fn(), set: vi.fn() })),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: createClientMock,
}));

import { GET, PATCH, DELETE } from "@/app/api/addresses/[id]/route";

function setupSupabaseMock(handlers: {
  addressesTable?: any;
  ticketsTable?: any;
}) {
  const supabase = {
    auth: {
      getUser: getUserMock,
    },
    from: vi.fn((table: string) => {
      if (table === "user_addresses") {
        return handlers.addressesTable;
      }
      if (table === "tickets") {
        return handlers.ticketsTable;
      }
      return {};
    }),
  };
  createClientMock.mockResolvedValue(supabase);
  return supabase;
}

describe("Address [id] API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
  });

  describe("GET /api/addresses/[id]", () => {
    it("returns 401 if user is unauthenticated", async () => {
      getUserMock.mockResolvedValue({
        data: { user: null },
        error: new Error("Unauthorized"),
      });
      setupSupabaseMock({});

      const req = new NextRequest(`https://uanginkuy.test/api/addresses/${addressId}`);
      const res = await GET(req, { params: Promise.resolve({ id: addressId }) });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it("returns 404 if address does not exist", async () => {
      const addressesQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") }),
      };
      setupSupabaseMock({ addressesTable: addressesQuery });

      const req = new NextRequest(`https://uanginkuy.test/api/addresses/${addressId}`);
      const res = await GET(req, { params: Promise.resolve({ id: addressId }) });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("returns 200 with address data when found", async () => {
      const mockAddress = {
        id: addressId,
        profile_id: userId,
        label: "Rumah",
        recipient_name: "Budi",
        phone_number: "08123456789",
        is_primary: true,
      };
      const addressesQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockAddress, error: null }),
      };
      setupSupabaseMock({ addressesTable: addressesQuery });

      const req = new NextRequest(`https://uanginkuy.test/api/addresses/${addressId}`);
      const res = await GET(req, { params: Promise.resolve({ id: addressId }) });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.label).toBe("Rumah");
    });
  });

  describe("PATCH /api/addresses/[id]", () => {
    it("returns 404 if address being edited does not exist", async () => {
      const addressesQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") }),
      };
      setupSupabaseMock({ addressesTable: addressesQuery });

      const req = new NextRequest(`https://uanginkuy.test/api/addresses/${addressId}`, {
        method: "PATCH",
        body: JSON.stringify({ label: "Kantor Baru" }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: addressId }) });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("updates address and unsets other primary addresses if is_primary: true", async () => {
      const existingAddress = {
        id: addressId,
        profile_id: userId,
        label: "Kantor",
        is_primary: false,
      };

      const updateMock = vi.fn().mockReturnThis();
      const addressesQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...existingAddress, is_primary: true, label: "Kantor Utama" },
          error: null,
        }),
        update: updateMock,
      };
      setupSupabaseMock({ addressesTable: addressesQuery });

      const req = new NextRequest(`https://uanginkuy.test/api/addresses/${addressId}`, {
        method: "PATCH",
        body: JSON.stringify({ label: "Kantor Utama", is_primary: true }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: addressId }) });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      // Verify unsetting existing primary address was called
      expect(updateMock).toHaveBeenCalledWith({ is_primary: false });
    });
  });

  describe("DELETE /api/addresses/[id]", () => {
    it("blocks deletion with 400 if address has active tickets", async () => {
      const existingAddress = {
        id: addressId,
        profile_id: userId,
        label: "Rumah",
        is_primary: false,
      };

      const addressesQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingAddress, error: null }),
      };

      // Ticket check returns 1 active ticket
      const ticketsQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 1, error: null }),
      };

      setupSupabaseMock({ addressesTable: addressesQuery, ticketsTable: ticketsQuery });

      const req = new NextRequest(`https://uanginkuy.test/api/addresses/${addressId}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: addressId }) });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toContain("Something went wrong");
    });

    it("deletes address and promotes another address if primary is deleted", async () => {
      const existingAddress = {
        id: addressId,
        profile_id: userId,
        label: "Rumah",
        is_primary: true,
      };

      const updateMock = vi.fn().mockReturnThis();
      const deleteMock = vi.fn().mockReturnThis();

      const addressesQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "addr-fallback" }, error: null }),
        single: vi.fn().mockResolvedValue({ data: existingAddress, error: null }),
        update: updateMock,
        delete: deleteMock,
      };

      // No active tickets
      const ticketsQuery: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ count: 0, error: null }),
      };

      setupSupabaseMock({ addressesTable: addressesQuery, ticketsTable: ticketsQuery });

      const req = new NextRequest(`https://uanginkuy.test/api/addresses/${addressId}`, {
        method: "DELETE",
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: addressId }) });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      // Verify promotion of fallback address
      expect(updateMock).toHaveBeenCalledWith({ is_primary: true });
      // Verify delete called
      expect(deleteMock).toHaveBeenCalled();
    });
  });
});
