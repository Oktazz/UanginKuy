import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  adminClientMock,
  createClientMock,
  retrieveKnowledgeMock,
  shouldRetrieveKnowledgeMock,
  streamResponseMock,
  checkAiRateLimitMock,
} = vi.hoisted(() => ({
  adminClientMock: vi.fn(),
  createClientMock: vi.fn(),
  retrieveKnowledgeMock: vi.fn(),
  shouldRetrieveKnowledgeMock: vi.fn(),
  streamResponseMock: vi.fn(),
  checkAiRateLimitMock: vi.fn(),
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

vi.mock("@/services/rag.service", () => ({
  retrieveKnowledge: retrieveKnowledgeMock,
  shouldRetrieveKnowledge: shouldRetrieveKnowledgeMock,
}));

vi.mock("@/services/chat-source.service", () => ({
  buildChatMessageMetadata: (sources: unknown[]) => ({ sources }),
  normalizeChatSources: () => [],
}));

vi.mock("@/services/ai-tools.service", () => ({
  getLatestTicket: vi.fn(),
  getPickupSchedule: vi.fn(),
  getTicketHistory: vi.fn(),
  getUserBalance: vi.fn(),
  getWasteSummary: vi.fn(),
}));

vi.mock("@/lib/ai-tools", () => ({
  AI_TOOL_DECLARATIONS: [],
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return {
        startChat: () => ({
          sendMessage: streamResponseMock,
        }),
      };
    }
  },
}));

vi.mock("@/lib/ai-rate-limit", () => ({
  checkAiRateLimit: checkAiRateLimitMock,
}));

import { POST } from "@/app/api/ai/chat/route";

describe("POST /api/ai/chat knowledge sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    checkAiRateLimitMock.mockResolvedValue({ allowed: true, remaining: 9 });
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null,
        }),
      },
    });

    const sessionChain = {
      eq: vi.fn(),
      insert: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: "session-id" },
        error: null,
      }),
      order: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
      update: vi.fn(),
    };
    for (const method of ["eq", "limit", "order", "select", "update"]) {
      sessionChain[method as keyof typeof sessionChain] = vi.fn().mockReturnValue(sessionChain) as never;
    }
    const messageChain = {
      eq: vi.fn(),
      order: vi.fn(),
      select: vi.fn(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn((payload: Record<string, unknown>) => {
        insertedMessages.push(payload);
        return Promise.resolve({ error: null });
      }),
    };
    for (const method of ["eq", "order", "select"]) {
      messageChain[method as keyof typeof messageChain] = vi.fn().mockReturnValue(messageChain) as never;
    }

    const insertedMessages: Record<string, unknown>[] = [];
    const adminFromMock = vi.fn((table: string) => {
      if (table === "chat_sessions") return sessionChain;
      return messageChain;
    });
    adminClientMock.mockReturnValue({ from: adminFromMock, insertedMessages });

    shouldRetrieveKnowledgeMock.mockReturnValue(true);
    retrieveKnowledgeMock.mockResolvedValue({
      context: "Kardus dipilah dari plastik.",
      sources: [
        {
          title: "Panduan Pemilahan",
          source: "documents/id.pdf",
          filename: "panduan-pemilahan.pdf",
          similarity: 0.91,
        },
      ],
    });
    streamResponseMock.mockResolvedValue({
      response: {
        candidates: [{}],
        functionCalls: () => [],
        text: () => "Jawaban dari knowledge.",
      },
    });
  });

  it("streams sources before done and stores them in assistant metadata", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: "Bagaimana memilah kardus?",
        }),
        headers: { "content-type": "application/json" },
      }),
    );
    const body = await response.text();
    const admin = adminClientMock.mock.results[0]?.value as {
      insertedMessages: Record<string, unknown>[];
    };
    const assistantMessage = admin.insertedMessages.find(
      (message) => message.role === "assistant",
    );

    expect(body).toContain(
      '"sources":[{"title":"Panduan Pemilahan","filename":"panduan-pemilahan.pdf","similarity":0.91}]',
    );
    expect(body.indexOf('"sources"')).toBeLessThan(body.indexOf("data: [DONE]"));
    expect(assistantMessage?.metadata).toEqual({
      sources: [
        {
          title: "Panduan Pemilahan",
          filename: "panduan-pemilahan.pdf",
          similarity: 0.91,
        },
      ],
    });
  });

  it("rejects messages outside the supported domain before touching the database", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Siapa perdana menteri Inggris?" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: "OUT_OF_SCOPE" });
    expect(adminClientMock).not.toHaveBeenCalled();
  });

  it("returns 429 when the user rate limit is exceeded", async () => {
    checkAiRateLimitMock.mockResolvedValue({ allowed: false, retryAfter: 17 });

    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Berapa saldo saya?" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("17");
    expect(await response.json()).toMatchObject({ code: "RATE_LIMITED" });
  });

  it("rejects a cross-origin request", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: "Berapa saldo saya?" }),
        headers: {
          "content-type": "application/json",
          origin: "https://attacker.example",
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "INVALID_ORIGIN" });
  });
});
