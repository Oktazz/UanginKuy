export type ImageFitMode = "cover" | "contain" | "fill" | "inside" | "outside";

export interface CompressImageOptions {
  /** Maximum width in pixels. Default: 512 */
  maxWidth?: number;
  /** Maximum height in pixels. Default: 512 */
  maxHeight?: number;
  /** WebP compression quality (1-100). Default: 80 */
  quality?: number;
  /** Fit mode. Default: "cover" */
  fit?: ImageFitMode;
}

/**
 * Compresses and converts an image buffer into WebP format before storing in object storage.
 * Gracefully falls back to original buffer if sharp is not available in serverless runtimes.
 */
export async function compressImageToWebP(
  input: Buffer | Uint8Array | ArrayBuffer,
  options: CompressImageOptions = {},
): Promise<Buffer> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 80,
    fit = "cover",
  } = options;

  let buffer: Buffer;
  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (input instanceof ArrayBuffer) {
    buffer = Buffer.from(input);
  } else {
    buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  }

  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default || sharpModule;

    return await sharp(buffer)
      .rotate() // auto-orient based on EXIF orientation
      .resize(maxWidth, maxHeight, {
        fit,
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
  } catch (err) {
    console.warn(
      "[compressImageToWebP] sharp unavailable or compression failed, returning original buffer:",
      err,
    );
    return buffer;
  }
}
