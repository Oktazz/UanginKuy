import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  processDropoffTransaction,
  requestCounterWithdrawal,
  verifyCounterToken,
  executeCounterWithdrawal,
  getActiveCounterToken,
  cancelCounterWithdrawal,
  refundExpiredCounterTokens,
} from "@/services/counter.service";
import { ApiError } from "@/utils/error-handler";

// Mock createAdminClient
const mockAdmin = {
  from: vi.fn(),
};

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => mockAdmin,
}));

describe("counter.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("processDropoffTransaction", () => {
    it("throws error if clientId is missing", async () => {
      await expect(
        processDropoffTransaction("admin-1", {
          clientId: "",
          paymentMethod: "cash",
          items: [],
        })
      ).rejects.toThrow(ApiError);
    });

    it("throws error if items array is empty", async () => {
      await expect(
        processDropoffTransaction("admin-1", {
          clientId: "client-1",
          paymentMethod: "cash",
          items: [],
        })
      ).rejects.toThrow("Minimal harus ada 1 jenis sampah yang ditimbang");
    });

    it("processes a walk-in cash drop-off successfully without increasing balance", async () => {
      // Mock profiles select (client check)
      const mockProfileSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "client-1", name: "Budi", balance: 50000 },
          error: null,
        }),
      };

      // Mock waste_categories
      const mockCatSelect = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: "Kardus", price_per_kg: 2000, carbon_factor: 2.5 }],
          error: null,
        }),
      };

      // Mock tickets insert
      const mockTicketInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "ticket-new", short_id: "TK-NEW123" },
          error: null,
        }),
      };

      // Mock transaction_details insert
      const mockTdInsert = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      // Mock audit_logs
      const mockAuditInsert = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "profiles") return mockProfileSelect;
        if (table === "waste_categories") return mockCatSelect;
        if (table === "tickets") return mockTicketInsert;
        if (table === "transaction_details") return mockTdInsert;
        if (table === "audit_logs") return mockAuditInsert;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const result = await processDropoffTransaction("admin-1", {
        clientId: "client-1",
        paymentMethod: "cash",
        items: [
          {
            wasteCategoryId: 1,
            weight: 5,
            priceApplied: 2000,
            subtotal: 10000,
          },
        ],
      });

      expect(result.ticketId).toBe("ticket-new");
      expect(result.ticketShortId).toHaveLength(8);
      expect(result.clientName).toBe("Budi");
      expect(result.paymentMethod).toBe("cash");
      expect(result.totalWeight).toBe(5);
      expect(result.totalAmount).toBe(10000);
      expect(result.carbonSaved).toBe(12.5);
    });
  });

  describe("requestCounterWithdrawal", () => {
    it("rejects withdrawal if amount is below minimum (< 10000)", async () => {
      await expect(
        requestCounterWithdrawal("client-1", 5000)
      ).rejects.toThrow("Minimal penarikan adalah Rp 10.000");
    });

    it("rejects withdrawal if balance is insufficient", async () => {
      const mockProfileSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "client-1", name: "Budi", balance: 20000 },
          error: null,
        }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "profiles") return mockProfileSelect;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      await expect(
        requestCounterWithdrawal("client-1", 50000)
      ).rejects.toThrow("Saldo Anda tidak mencukupi");
    });

    it("generates 6-digit token and holds balance on valid request", async () => {
      const mockProfileSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "client-1", name: "Budi", balance: 100000 },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      };

      const mockWithdrawalInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({
          data: { id: "wd-1" },
          error: null,
        }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "profiles") return mockProfileSelect;
        if (table === "withdrawals") return mockWithdrawalInsert;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const result = await requestCounterWithdrawal("client-1", 50000);

      expect(result.withdrawalId).toBe("wd-1");
      expect(result.tokenCode).toMatch(/^\d{6}$/);
      expect(result.amount).toBe(50000);
      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("verifyCounterToken and executeCounterWithdrawal", () => {
    it("verifies a valid pending token correctly", async () => {
      const mockWithdrawalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "wd-1",
            amount: 25000,
            token_code: "123456",
            token_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            status: "pending",
            profiles: {
              id: "client-1",
              name: "Siti",
              account_number: "UKN-998877",
              balance: 75000,
              avatar_url: null,
            },
          },
          error: null,
        }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "withdrawals") return mockWithdrawalQuery;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const verification = await verifyCounterToken("123456");

      expect(verification.withdrawalId).toBe("wd-1");
      expect(verification.amount).toBe(25000);
      expect(verification.tokenCode).toBe("123456");
      expect(verification.client.name).toBe("Siti");
      expect(verification.client.account_number).toBe("UKN-998877");
      expect(verification.isExpired).toBe(false);
    });

    it("successfully executes counter cash withdrawal and logs audit", async () => {
      const mockWithdrawalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "wd-1",
            amount: 25000,
            token_code: "123456",
            token_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            status: "pending",
            profiles: {
              id: "client-1",
              name: "Siti",
              account_number: "UKN-998877",
              balance: 75000,
              avatar_url: null,
            },
          },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      };

      const mockAuditInsert = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "withdrawals") return mockWithdrawalQuery;
        if (table === "audit_logs") return mockAuditInsert;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const res = await executeCounterWithdrawal("admin-1", "123456");

      expect(res.withdrawalId).toBe("wd-1");
      expect(res.amount).toBe(25000);
      expect(mockWithdrawalQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          served_by_admin_id: "admin-1",
        })
      );
    });
  });

  describe("getActiveCounterToken and cancelCounterWithdrawal", () => {
    it("returns active counter token if one is pending and not expired", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "wd-active-1",
            token_code: "987654",
            token_expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
            amount: 50000,
          },
          error: null,
        }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "withdrawals") return mockQuery;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const token = await getActiveCounterToken("client-1");
      expect(token).not.toBeNull();
      expect(token?.tokenCode).toBe("987654");
      expect(token?.amount).toBe(50000);
    });

    it("cancels active counter withdrawal and restores user balance", async () => {
      const mockWithdrawalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "wd-cancel-1",
            client_id: "client-1",
            amount: 50000,
            status: "pending",
            withdrawal_type: "cash_counter",
          },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      };

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "client-1", balance: 25000 },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "withdrawals") return mockWithdrawalQuery;
        if (table === "profiles") return mockProfileQuery;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const result = await cancelCounterWithdrawal("client-1", "wd-cancel-1");
      expect(result.refundedAmount).toBe(50000);
      expect(result.newBalance).toBe(75000);
      expect(mockProfileQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ balance: 75000 })
      );
      expect(mockWithdrawalQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          failure_reason: "Dibatalkan oleh nasabah",
        })
      );
    });

    it("refunds expired counter tokens automatically", async () => {
      const mockWithdrawalQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) =>
          resolve({
            data: [
              {
                id: "wd-exp-1",
                client_id: "client-1",
                amount: 30000,
                token_expires_at: new Date(Date.now() - 5000).toISOString(),
              },
            ],
            error: null,
          })
        ),
      };

      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { balance: 20000 },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "withdrawals") return mockWithdrawalQuery;
        if (table === "profiles") return mockProfileQuery;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const count = await refundExpiredCounterTokens("client-1");
      expect(count).toBe(1);
      expect(mockProfileQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ balance: 50000 })
      );
      expect(mockWithdrawalQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          failure_reason: "Token telah kadaluarsa (30 menit)",
        })
      );
    });
  });
});
