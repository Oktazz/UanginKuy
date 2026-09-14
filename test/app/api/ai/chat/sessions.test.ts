import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { adminClientMock, createClientMock } = vi.hoisted(() => ({
  adminClientMock: vi.fn(),
  createClientMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/utils/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: adminClientMock,
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    del: vi.fn().mockResolvedValue(1),
  },
  isRedisConfigured: true,
}));

import { GET, POST, DELETE } from "@/app/api/ai/chat/sessions/route";

describe("/api/ai/chat/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/ai/chat/sessions", () => {
    it("returns 401 when unauthorized", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") }),
        },
      });

      const response = await GET();
      expect(response.status).toBe(401);
    });

    it("returns list of sessions for authenticated user", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-abc" } },
            error: null,
          }),
        },
      });

      const mockSessions = [
        { id: "session-1", title: "Pertanyaan Sampah", created_at: "2026-09-14T10:00:00Z", updated_at: "2026-09-14T10:05:00Z" },
        { id: "session-2", title: "Jadwal Penjemputan", created_at: "2026-09-13T09:00:00Z", updated_at: "2026-09-13T09:10:00Z" },
      ];

      const queryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockSessions, error: null }),
      };

      adminClientMock.mockReturnValue({
        from: vi.fn().mockReturnValue(queryChain),
      });

      const response = await GET();
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.sessions).toHaveLength(2);
      expect(json.sessions[0].id).toBe("session-1");
      expect(json.sessions[1].title).toBe("Jadwal Penjemputan");
    });
  });

  describe("POST /api/ai/chat/sessions", () => {
    it("returns 401 when unauthorized", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") }),
        },
      });

      const response = await POST();
      expect(response.status).toBe(401);
    });

    it("creates a new session and returns 201", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-abc" } },
            error: null,
          }),
        },
      });

      const newSession = {
        id: "new-session-123",
        title: "Percakapan Baru",
        created_at: "2026-09-14T12:00:00Z",
        updated_at: "2026-09-14T12:00:00Z",
      };

      const queryChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
      };

      adminClientMock.mockReturnValue({
        from: vi.fn().mockReturnValue(queryChain),
      });

      const response = await POST();
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.session.id).toBe("new-session-123");
      expect(json.session.title).toBe("Percakapan Baru");
    });
  });

  describe("DELETE /api/ai/chat/sessions", () => {
    it("returns 401 when unauthorized", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") }),
        },
      });

      const req = new NextRequest("http://localhost/api/ai/chat/sessions?id=session-123", {
        method: "DELETE",
      });

      const response = await DELETE(req);
      expect(response.status).toBe(401);
    });

    it("returns 400 when session ID is missing", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-abc" } },
            error: null,
          }),
        },
      });

      const req = new NextRequest("http://localhost/api/ai/chat/sessions", {
        method: "DELETE",
      });

      const response = await DELETE(req);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("ID sesi");
    });

    it("returns 404 when session does not belong to user", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-abc" } },
            error: null,
          }),
        },
      });

      const findChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      adminClientMock.mockReturnValue({
        from: vi.fn().mockReturnValue(findChain),
      });

      const req = new NextRequest("http://localhost/api/ai/chat/sessions?id=foreign-session", {
        method: "DELETE",
      });

      const response = await DELETE(req);
      expect(response.status).toBe(404);
    });

    it("deletes messages and session when session belongs to user", async () => {
      createClientMock.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-abc" } },
            error: null,
          }),
        },
      });

      const findChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "session-own" }, error: null }),
      };

      const deleteMessageChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const deleteSessionChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      adminClientMock.mockReturnValue({
        from: vi.fn((table: string) => {
          if (table === "chat_messages") return deleteMessageChain;
          if (table === "chat_sessions") {
            // First call is findChain, second is deleteSessionChain
            return findChain.maybeSingle.mock.calls.length > 0 ? deleteSessionChain : findChain;
          }
          return findChain;
        }),
      });

      const req = new NextRequest("http://localhost/api/ai/chat/sessions?id=session-own", {
        method: "DELETE",
      });

      const response = await DELETE(req);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.success).toBe(true);
    });
  });
});
