import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { compressImageToWebP } from "@/services/image.service";

describe("compressImageToWebP", () => {
  it("converts a JPEG image to a compressed WebP format", async () => {
    // Generate a 1000x800 sample JPEG image
    const rawJpeg = await sharp({
      create: {
        width: 1000,
        height: 800,
        channels: 3,
        background: { r: 34, g: 197, b: 94 },
      },
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    const webpBuffer = await compressImageToWebP(rawJpeg, {
      maxWidth: 256,
      maxHeight: 256,
      quality: 75,
    });

    const metadata = await sharp(webpBuffer).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBeLessThanOrEqual(256);
    expect(metadata.height).toBeLessThanOrEqual(256);
    expect(webpBuffer.length).toBeLessThan(rawJpeg.length);
  });

  it("handles Uint8Array input cleanly", async () => {
    const rawPng = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 0, g: 0, b: 255, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    const uint8 = new Uint8Array(rawPng);
    const webpBuffer = await compressImageToWebP(uint8);
    const metadata = await sharp(webpBuffer).metadata();

    expect(metadata.format).toBe("webp");
  });
});
