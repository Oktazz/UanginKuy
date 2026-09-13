// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compressImageBrowser, COMPRESS_THRESHOLD_BYTES } from "@/services/client-image.service";

describe("client-image.service", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });

    class MockImage {
      onload: (() => void) | null = null;
      width = 2400;
      height = 1200;
      set src(_val: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    vi.stubGlobal("Image", MockImage);

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      drawImage: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
      callback(new Blob(["compressed-data"], { type: "image/webp" }));
    }) as unknown as typeof HTMLCanvasElement.prototype.toBlob;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports COMPRESS_THRESHOLD_BYTES as 300 KB", () => {
    expect(COMPRESS_THRESHOLD_BYTES).toBe(300 * 1024);
  });

  it("compresses and renames image to WebP with target MIME type", async () => {
    const originalFile = new File(["raw-bytes"], "picture.png", { type: "image/png" });
    const result = await compressImageBrowser(originalFile, {
      maxDimension: 1920,
      quality: 0.8,
    });

    expect(result.name).toBe("picture.webp");
    expect(result.type).toBe("image/webp");
  });

  it("rejects when image cannot be loaded", async () => {
    class FailingImage {
      onerror: (() => void) | null = null;
      set src(_val: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    vi.stubGlobal("Image", FailingImage);

    const corruptFile = new File(["bad"], "corrupt.jpg", { type: "image/jpeg" });
    await expect(compressImageBrowser(corruptFile)).rejects.toThrow("Gagal memuat gambar.");
  });
});
