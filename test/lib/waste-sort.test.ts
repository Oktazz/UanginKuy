import { describe, expect, it } from "vitest";

import {
  buildWasteSortResult,
  parseWasteVisionResponse,
  validateWasteImage,
} from "@/lib/waste-sort";

const categories = [
  { id: 1, name: "Botol PET", material_group: "plastic" },
  { id: 2, name: "Kardus", material_group: "paper" },
];

describe("waste sort result", () => {
  it("matches model detections to server-owned categories and adds safe guidance", () => {
    const modelResult = parseWasteVisionResponse(JSON.stringify({
      image_quality: "good",
      unsupported_visible: false,
      detections: [
        { category_id: 1, confidence: "high", issues: ["dirty"] },
        { category_id: 2, confidence: "medium", issues: ["wet"] },
      ],
    }));

    const result = buildWasteSortResult(modelResult, categories);

    expect(result.status).toBe("needs_separation");
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      categoryId: 1,
      name: "Botol PET",
      confidence: "high",
      issues: ["Masih terlihat kotor atau memiliki sisa isi."],
    });
    expect(result.items[0].preparationSteps).toContain("Kosongkan dan bilas kemasan.");
  });

  it("does not expose hallucinated category ids", () => {
    const modelResult = parseWasteVisionResponse(JSON.stringify({
      image_quality: "good",
      unsupported_visible: true,
      detections: [
        { category_id: 999, confidence: "high", issues: [] },
      ],
    }));

    const result = buildWasteSortResult(modelResult, categories);

    expect(result.status).toBe("unsupported");
    expect(result.items).toEqual([]);
  });

  it("marks low-confidence and mixed detections conservatively", () => {
    const low = parseWasteVisionResponse(JSON.stringify({
      image_quality: "good",
      unsupported_visible: false,
      detections: [{ category_id: 1, confidence: "low", issues: [] }],
    }));
    const mixed = parseWasteVisionResponse(JSON.stringify({
      image_quality: "good",
      unsupported_visible: false,
      detections: [{ category_id: 1, confidence: "high", issues: ["mixed"] }],
    }));

    expect(buildWasteSortResult(low, categories)).toMatchObject({ status: "uncertain", needsRetake: true });
    expect(buildWasteSortResult(mixed, categories)).toMatchObject({ status: "needs_separation", needsRetake: false });
  });

  it("uses safe default guidance for an unknown material group", () => {
    const modelResult = parseWasteVisionResponse(JSON.stringify({
      image_quality: "good",
      unsupported_visible: false,
      detections: [{ category_id: 3, confidence: "high", issues: [] }],
    }));
    const result = buildWasteSortResult(modelResult, [
      ...categories,
      { id: 3, name: "Material lain", material_group: "other" },
    ]);

    expect(result.items[0].preparationSteps).toContain("Pisahkan dari sampah organik dan material lain.");
  });

  it("requests a retake for a blurry image instead of forcing a category", () => {
    const modelResult = parseWasteVisionResponse(JSON.stringify({
      image_quality: "poor",
      retake_reason: "Foto terlalu gelap.",
      unsupported_visible: false,
      detections: [],
    }));

    expect(buildWasteSortResult(modelResult, categories)).toMatchObject({
      status: "uncertain",
      needsRetake: true,
      retakeReason: "Foto terlalu gelap.",
    });
  });

  it("accepts JSON wrapped in a markdown fence", () => {
    expect(parseWasteVisionResponse("```json\n{\"image_quality\":\"good\",\"unsupported_visible\":false,\"detections\":[]}\n```"))
      .toMatchObject({ image_quality: "good" });
  });

  it("normalizes common Gemini JSON variations without throwing", () => {
    const diagnostics: unknown[] = [];
    const result = parseWasteVisionResponse(JSON.stringify({
      image_quality: "good",
      retake_reason: null,
      unsupported_visible: false,
      unexpected: "ignored",
      detections: [
        { category_id: "1", confidence: "very_sure", issues: ["dirty", "unknown_issue"], extra: true },
        { category_id: 1, confidence: "high", issues: [] },
        { category_id: "invalid", confidence: "high", issues: [] },
        { category_id: 2, confidence: "medium", issues: [] },
      ],
    }), (diagnostic) => diagnostics.push(diagnostic));

    expect(result).toEqual({
      image_quality: "good",
      retake_reason: undefined,
      unsupported_visible: false,
      detections: [
        { category_id: 1, confidence: "low", issues: ["dirty"] },
      ],
    });
    expect(diagnostics).toHaveLength(1);
  });

  it("turns malformed model JSON into a conservative retake result", () => {
    const diagnostics: Array<{ kind: string; paths: string[] }> = [];

    const result = parseWasteVisionResponse("{not-json", (diagnostic) => diagnostics.push(diagnostic));

    expect(result).toEqual({
      image_quality: "poor",
      unsupported_visible: false,
      detections: [],
      retake_reason: "Format hasil analisis tidak valid.",
    });
    expect(diagnostics).toEqual([{ kind: "invalid_json", paths: [] }]);
  });
});

describe("waste image validation", () => {
  it("accepts a JPEG whose signature matches its MIME type", async () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], "waste.jpg", {
      type: "image/jpeg",
    });

    await expect(validateWasteImage(file)).resolves.toEqual({ ok: true });
  });

  it("rejects spoofed and oversized images", async () => {
    const spoofed = new File(["not an image"], "waste.png", { type: "image/png" });
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", {
      type: "image/jpeg",
    });

    await expect(validateWasteImage(spoofed)).resolves.toMatchObject({ ok: false });
    await expect(validateWasteImage(oversized)).resolves.toMatchObject({ ok: false });
  });

  it("accepts valid PNG and WebP signatures and rejects unsupported MIME types", async () => {
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "waste.png", { type: "image/png" });
    const webp = new File([new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])], "waste.webp", { type: "image/webp" });
    const gif = new File(["GIF89a"], "waste.gif", { type: "image/gif" });

    await expect(validateWasteImage(png)).resolves.toEqual({ ok: true });
    await expect(validateWasteImage(webp)).resolves.toEqual({ ok: true });
    await expect(validateWasteImage(gif)).resolves.toMatchObject({ ok: false, code: "INVALID_TYPE" });
  });
});
