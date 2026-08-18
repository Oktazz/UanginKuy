import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  checkRateLimit: vi.fn(),
  generateContent: vi.fn(),
  getGenerativeModel: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: vi.fn().mockResolvedValue({}) }));
vi.mock("@/utils/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/ai-rate-limit", () => ({ checkAiSortRateLimit: mocks.checkRateLimit }));
vi.mock("@google/generative-ai", () => ({
  SchemaType: {
    ARRAY: "array",
    BOOLEAN: "boolean",
    INTEGER: "integer",
    OBJECT: "object",
    STRING: "string",
  },
  GoogleGenerativeAI: class {
    getGenerativeModel(config: unknown) {
      mocks.getGenerativeModel(config);
      return { generateContent: mocks.generateContent };
    }
  },
}));

import { POST } from "@/app/api/ai/sort/route";

function requestWith(file: File, origin = "http://localhost") {
  const form = new FormData();
  form.set("image", file);
  return new NextRequest("http://localhost/api/ai/sort", {
    method: "POST",
    body: form,
    headers: { origin },
  });
}

describe("POST /api/ai/sort", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 });
    mocks.createClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn().mockResolvedValue({
            data: [{ id: 1, name: "Botol PET", material_group: "plastic" }],
            error: null,
          }),
        })),
      })),
    });
    mocks.generateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          image_quality: "good",
          unsupported_visible: false,
          detections: [{ category_id: 1, confidence: "high", issues: ["dirty"] }],
        }),
      },
    });
  });

  it("returns a server-reconciled sorting result without persisting the image", async () => {
    const image = new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], "waste.jpg", {
      type: "image/jpeg",
    });

    const response = await POST(requestWith(image));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.items[0]).toMatchObject({ categoryId: 1, name: "Botol PET" });
    expect(mocks.generateContent).toHaveBeenCalledOnce();
    expect(mocks.getGenerativeModel).toHaveBeenCalledWith(expect.objectContaining({
      generationConfig: expect.objectContaining({
        responseMimeType: "application/json",
        responseSchema: expect.objectContaining({ type: "object" }),
      }),
    }));
  });

  it("requires an authenticated user", async () => {
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    });
    const image = new File([new Uint8Array([0xff, 0xd8, 0xff])], "waste.jpg", {
      type: "image/jpeg",
    });

    const response = await POST(requestWith(image));

    expect(response.status).toBe(401);
    expect(mocks.generateContent).not.toHaveBeenCalled();
  });

  it("rejects cross-origin and spoofed image requests", async () => {
    const image = new File(["not-png"], "waste.png", { type: "image/png" });

    const crossOrigin = await POST(requestWith(image, "https://attacker.example"));
    const spoofed = await POST(requestWith(image));

    expect(crossOrigin.status).toBe(403);
    expect(spoofed.status).toBe(415);
    expect(mocks.generateContent).not.toHaveBeenCalled();
  });

  it("returns retry information when rate limited", async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, retryAfter: 23 });
    const image = new File([new Uint8Array([0xff, 0xd8, 0xff])], "waste.jpg", {
      type: "image/jpeg",
    });

    const response = await POST(requestWith(image));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("23");
  });

  it("handles missing configuration and missing image input", async () => {
    const noImageRequest = new NextRequest("http://localhost/api/ai/sort", {
      method: "POST",
      body: new FormData(),
      headers: { origin: "http://localhost" },
    });
    const missingImage = await POST(noImageRequest);

    delete process.env.GEMINI_API_KEY;
    const image = new File([new Uint8Array([0xff, 0xd8, 0xff])], "waste.jpg", { type: "image/jpeg" });
    const unavailable = await POST(requestWith(image));

    expect(missingImage.status).toBe(400);
    expect(unavailable.status).toBe(503);
  });

  it("fails safely when categories are unavailable", async () => {
    const client = await mocks.createClient();
    mocks.createClient.mockResolvedValueOnce({
      ...client,
      from: vi.fn(() => ({
        select: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [], error: null }) })),
      })),
    });
    const image = new File([new Uint8Array([0xff, 0xd8, 0xff])], "waste.jpg", { type: "image/jpeg" });
    const noCategories = await POST(requestWith(image));

    expect(noCategories.status).toBe(503);
  });

  it("returns an uncertain result instead of 502 for malformed model JSON", async () => {
    mocks.generateContent.mockResolvedValueOnce({ response: { text: () => "not-json" } });
    const image = new File([new Uint8Array([0xff, 0xd8, 0xff])], "waste.jpg", { type: "image/jpeg" });

    const response = await POST(requestWith(image));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ status: "uncertain", needsRetake: true });
  });

  it("keeps upstream Gemini failures as 502 responses", async () => {
    mocks.generateContent.mockRejectedValueOnce(new Error("provider unavailable"));
    const image = new File([new Uint8Array([0xff, 0xd8, 0xff])], "waste.jpg", { type: "image/jpeg" });

    const response = await POST(requestWith(image));

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: "ANALYSIS_FAILED" });
  });

  it("treats an empty Gemini response as an upstream failure", async () => {
    mocks.generateContent.mockResolvedValueOnce({ response: { text: () => "  " } });
    const image = new File([new Uint8Array([0xff, 0xd8, 0xff])], "waste.jpg", { type: "image/jpeg" });

    const response = await POST(requestWith(image));

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: "ANALYSIS_FAILED" });
  });
});
