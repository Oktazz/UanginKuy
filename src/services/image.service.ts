import sharp from "sharp";

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

  return sharp(buffer)
    .rotate() // auto-orient based on EXIF orientation
    .resize(maxWidth, maxHeight, {
      fit,/*  */
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
}
