import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockTicketQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
};

const mockAdminUpdate = vi.fn().mockReturnThis();
const mockAdminEq = vi.fn();
const mockAdminInsertAudit = vi.fn();

const mockServerClient = {
  auth: { getUser: mockGetUser },
  from: vi.fn((table: string) => {
    if (table === "tickets") return mockTicketQuery;
    return {};
  }),
};

const mockAdminClient = {
  from: vi.fn((table: string) => {
    if (table === "tickets") {
      return {
        update: (...args: unknown[]) => {
          mockAdminUpdate(...args);
          return { eq: mockAdminEq };
        },
      };
    }
    if (table === "audit_logs") {
      return {
        insert: mockAdminInsertAudit,
      };
    }
    return {};
  }),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({})),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => mockServerClient),
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}));

import { cancelTicket } from "@/app/(nasabah)/tickets/[id]/actions";

describe("cancelTicket Server Action", () => {
  const userId = "user-uuid-123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId, email: "nasabah@test.com" } },
      error: null,
    });
    mockAdminEq.mockResolvedValue({ error: null });
    mockAdminInsertAudit.mockResolvedValue({ error: null });
  });

  it("fails when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });

    const result = await cancelTicket("ticket-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Sesi Anda telah berakhir");
  });

  it("fails when ticket is not found or not owned by the user", async () => {
    mockTicketQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await cancelTicket("ticket-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Tiket tidak ditemukan");
  });

  it("fails when ticket is already cancelled", async () => {
    mockTicketQuery.maybeSingle.mockResolvedValue({
      data: {
        id: "ticket-123",
        short_id: "TK-1234",
        client_id: userId,
        status: "cancelled",
      },
      error: null,
    });

    const result = await cancelTicket("ticket-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("sudah dibatalkan");
  });

  it("fails when ticket is already completed", async () => {
    mockTicketQuery.maybeSingle.mockResolvedValue({
      data: {
        id: "ticket-123",
        short_id: "TK-1234",
        client_id: userId,
        status: "completed",
      },
      error: null,
    });

    const result = await cancelTicket("ticket-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("tidak dapat dibatalkan");
  });

  it("rejects cancellation when courier is on the way", async () => {
    mockTicketQuery.maybeSingle.mockResolvedValue({
      data: {
        id: "ticket-123",
        short_id: "TK-1234",
        client_id: userId,
        status: "on_the_way",
      },
      error: null,
    });

    const result = await cancelTicket("ticket-123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Kurir sedang dalam perjalanan");
  });

  it("successfully cancels a pending ticket and logs to audit_logs", async () => {
    mockTicketQuery.maybeSingle.mockResolvedValue({
      data: {
        id: "ticket-123",
        short_id: "TK-1234",
        client_id: userId,
        status: "pending",
        courier_id: null,
        pickup_date: "2026-09-10",
      },
      error: null,
    });

    const result = await cancelTicket("ticket-123", "Jadwal bentrok");
    expect(result.success).toBe(true);

    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        route_sequence: null,
        courier_id: null,
      }),
    );
    expect(mockAdminEq).toHaveBeenCalledWith("id", "ticket-123");

    expect(mockAdminInsertAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "TICKET_CANCELLED",
        actor_id: userId,
        target_id: "ticket-123",
        details: expect.objectContaining({
          reason: "Jadwal bentrok",
          previous_status: "pending",
        }),
      }),
    );
  });

  it("successfully cancels a scheduled ticket and unassigns courier", async () => {
    mockTicketQuery.maybeSingle.mockResolvedValue({
      data: {
        id: "ticket-456",
        short_id: "TK-4567",
        client_id: userId,
        status: "scheduled",
        courier_id: "courier-999",
        pickup_date: "2026-09-10",
      },
      error: null,
    });

    const result = await cancelTicket("TK-4567", "Sampah belum siap");
    expect(result.success).toBe(true);

    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "cancelled",
        route_sequence: null,
        courier_id: null,
      }),
    );

    expect(mockAdminInsertAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          reason: "Sampah belum siap",
          previous_status: "scheduled",
          previous_courier_id: "courier-999",
        }),
      }),
    );
  });
});
