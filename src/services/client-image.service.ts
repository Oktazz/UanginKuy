export interface ClientCompressOptions {
  /** Maximum width or height in pixels. Default: 1920 */
  maxDimension?: number;
  /** Compression quality between 0 and 1. Default: 0.8 */
  quality?: number;
  /** Output MIME type. Default: "image/webp" */
  targetType?: string;
}

/** Threshold in bytes above which compression is triggered (300 KB) */
export const COMPRESS_THRESHOLD_BYTES = 300 * 1024;

/**
 * Compresses an image file in the browser using HTML5 Canvas and converts it to WebP format.
 * Can be reused across client components (e.g. Asisten Sortir, Avatar Editor).
 */
export function compressImageBrowser(
  source: File,
  options: ClientCompressOptions = {},
): Promise<File> {
  const {
    maxDimension = 1920,
    quality = 0.8,
    targetType = "image/webp",
  } = options;

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return resolve(source);
    }

    const url = URL.createObjectURL(source);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height / width) * maxDimension);
          width = maxDimension;
        } else {
          width = Math.round((width / height) * maxDimension);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Canvas tidak tersedia."));
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error("Kompresi gambar gagal."));
          }
          const nextName = source.name.replace(/\.[^.]+$/, ".webp");
          resolve(new File([blob], nextName, { type: blob.type || targetType }));
        },
        targetType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memuat gambar."));
    };

    img.src = url;
  });
}
