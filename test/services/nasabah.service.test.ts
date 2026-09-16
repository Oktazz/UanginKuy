import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getNasabahList,
  getNasabahSummaryMetrics,
  getNasabahDetail,
} from "@/services/nasabah.service";
import { ApiError } from "@/utils/error-handler";

const mockAdmin = {
  from: vi.fn(),
};

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: () => mockAdmin,
}));

describe("nasabah.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNasabahList", () => {
    it("returns formatted nasabah list with primary address", async () => {
      const mockProfiles = [
        {
          id: "client-1",
          name: "Siti Rahma",
          account_number: "UKN-123456",
          balance: 75000,
          avatar_url: null,
          created_at: "2026-08-01T10:00:00Z",
          user_addresses: [
            {
              id: "addr-1",
              label: "Rumah",
              phone_number: "081234567890",
              full_address: "Jl. Mawar No. 12",
              city: "Jakarta Selatan",
              district: "Tebet",
              is_primary: true,
            },
          ],
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockProfiles,
          count: 1,
          error: null,
        }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "profiles") return mockQuery;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const result = await getNasabahList({ page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.nasabah).toHaveLength(1);
      expect(result.nasabah[0].name).toBe("Siti Rahma");
      expect(result.nasabah[0].account_number).toBe("UKN-123456");
      expect(result.nasabah[0].balance).toBe(75000);
      expect(result.nasabah[0].phone_number).toBe("081234567890");
      expect(result.nasabah[0].city).toBe("Jakarta Selatan");
    });

    it("applies search and hasBalance filters correctly", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "profiles") return mockQuery;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const result = await getNasabahList({
        search: "Budi",
        hasBalance: "yes",
      });

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining("Budi")
      );
      expect(mockQuery.gt).toHaveBeenCalledWith("balance", 0);
      expect(result.nasabah).toEqual([]);
    });
  });

  describe("getNasabahSummaryMetrics", () => {
    it("calculates total balance and active nasabah count correctly", async () => {
      const mockProfiles = [
        { balance: 50000 },
        { balance: 25000 },
        { balance: 0 },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockProfiles,
          count: 3,
          error: null,
        }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "profiles") return mockQuery;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const metrics = await getNasabahSummaryMetrics();

      expect(metrics.totalNasabah).toBe(3);
      expect(metrics.totalBalance).toBe(75000);
      expect(metrics.activeNasabahCount).toBe(2);
    });
  });

  describe("getNasabahDetail", () => {
    it("throws 404 if nasabah is not found", async () => {
      const mockProfileQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "profiles") return mockProfileQuery;
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      await expect(getNasabahDetail("unknown-id")).rejects.toThrow(ApiError);
    });

    it("returns complete 360-degree data with aggregated statistics", async () => {
      const mockProfile = {
        id: "client-1",
        name: "Ahmad",
        account_number: "UKN-999888",
        balance: 120000,
        avatar_url: null,
        created_at: "2026-07-15T08:00:00Z",
        role: "nasabah",
      };

      const mockAddresses = [
        {
          id: "addr-1",
          label: "Rumah",
          recipient_name: "Ahmad",
          phone_number: "081122334455",
          full_address: "Jl. Melati No. 5",
          district: "Gambir",
          city: "Jakarta Pusat",
          is_primary: true,
        },
      ];

      const mockTickets = [
        {
          id: "ticket-1",
          short_id: "TK-ABC123",
          service_type: "drop_off",
          status: "completed",
          payment_method: "balance",
          created_at: "2026-08-10T11:00:00Z",
          pickup_date: null,
          transaction_details: [
            {
              id: 1,
              weight: 10,
              price_applied: 3000,
              subtotal: 30000,
              waste_categories: { name: "Kardus" },
            },
          ],
        },
      ];

      const mockWithdrawals = [
        {
          id: "wd-1",
          amount: 50000,
          fee_amount: 0,
          net_amount: 50000,
          bank_name: "bca",
          account_number: "1234567890",
          withdrawal_type: "bank_transfer",
          token_code: null,
          status: "success",
          failure_reason: null,
          created_at: "2026-08-15T14:00:00Z",
          completed_at: "2026-08-15T14:01:00Z",
          refunded_at: null,
        },
      ];

      mockAdmin.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          };
        }
        if (table === "user_addresses") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockAddresses,
              error: null,
            }),
          };
        }
        if (table === "tickets") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockTickets,
              error: null,
            }),
          };
        }
        if (table === "withdrawals") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockWithdrawals,
              error: null,
            }),
          };
        }
        return {} as unknown as ReturnType<typeof mockAdmin.from>;
      });

      const detail = await getNasabahDetail("client-1");

      expect(detail.profile.name).toBe("Ahmad");
      expect(detail.profile.balance).toBe(120000);
      expect(detail.addresses).toHaveLength(1);
      expect(detail.wasteDeposits).toHaveLength(1);
      expect(detail.wasteDeposits[0].totalWeight).toBe(10);
      expect(detail.wasteDeposits[0].totalAmount).toBe(30000);
      expect(detail.withdrawals).toHaveLength(1);
      expect(detail.withdrawals[0].status).toBe("success");

      // Aggregate statistics
      expect(detail.statistics.totalWasteWeight).toBe(10);
      expect(detail.statistics.totalWasteEarnings).toBe(30000);
      expect(detail.statistics.totalWithdrawn).toBe(50000);
    });
  });
});
