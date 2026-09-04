import { randomUUID } from "node:crypto";

import mammoth from "mammoth";

// Polyfill web APIs needed by pdf-parse / pdfjs-dist in Node.js serverless runtimes (such as Vercel)
if (typeof globalThis.DOMMatrix === "undefined") {
  class PolyfillDOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(_init?: unknown) {}
    multiply() {
      return this;
    }
    multiplySelf() {
      return this;
    }
    preMultiplySelf() {
      return this;
    }
    translate() {
      return this;
    }
    translateSelf() {
      return this;
    }
    scale() {
      return this;
    }
    scaleSelf() {
      return this;
    }
    invertSelf() {
      return this;
    }
    rotate() {
      return this;
    }
    rotateSelf() {
      return this;
    }
    transformPoint(point: unknown) {
      return point;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).DOMMatrix = PolyfillDOMMatrix;
}

if (typeof globalThis.ImageData === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ImageData = class ImageData {};
}

if (typeof globalThis.Path2D === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Path2D = class Path2D {
    addPath() {}
    rect() {}
  };
}

import { PDFParse } from "pdf-parse";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 100_000;

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type KnowledgeDocumentExtension = "pdf" | "docx";

export interface KnowledgeUploadDescriptor {
  name: string;
  type: string;
  size: number;
  signature: Uint8Array;
}

export interface ValidKnowledgeUpload {
  extension: KnowledgeDocumentExtension;
  mimeType: "application/pdf" | typeof DOCX_MIME_TYPE;
}

function extensionFromName(name: string): KnowledgeDocumentExtension | null {
  const extension = name.trim().toLowerCase().split(".").pop();
  return extension === "pdf" || extension === "docx" ? extension : null;
}

function startsWith(bytes: Uint8Array, expected: number[]) {
  return expected.every((value, index) => bytes[index] === value);
}

function hasPdfSignature(signature: Uint8Array) {
  return startsWith(signature, [0x25, 0x50, 0x44, 0x46, 0x2d]);
}

function hasDocxSignature(signature: Uint8Array) {
  return (
    startsWith(signature, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(signature, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(signature, [0x50, 0x4b, 0x07, 0x08])
  );
}

export function validateKnowledgeUpload(
  upload: KnowledgeUploadDescriptor,
): ValidKnowledgeUpload | null {
  const extension = extensionFromName(upload.name);
  const type = upload.type.trim().toLowerCase();

  if (
    !extension ||
    !Number.isFinite(upload.size) ||
    upload.size < 1 ||
    upload.size > MAX_UPLOAD_BYTES
  ) {
    return null;
  }

  if (extension === "pdf") {
    if (type && type !== "application/pdf") return null;
    return hasPdfSignature(upload.signature)
      ? { extension, mimeType: "application/pdf" }
      : null;
  }

  if (type && type !== DOCX_MIME_TYPE) return null;
  return hasDocxSignature(upload.signature)
    ? { extension, mimeType: DOCX_MIME_TYPE }
    : null;
}

export function normalizeExtractedDocumentText(value: string): string | null {
  const text = value
    .replaceAll("\u0000", "")
    .replaceAll("\r", "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text || text.length > MAX_EXTRACTED_TEXT_LENGTH) return null;
  return text;
}

export async function extractKnowledgeDocumentText(
  content: Uint8Array,
  extension: KnowledgeDocumentExtension,
): Promise<string | null> {
  if (extension === "docx") {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(content),
    });
    return normalizeExtractedDocumentText(result.value);
  }

  const parser = new PDFParse({ data: content });
  try {
    const result = await parser.getText();
    return normalizeExtractedDocumentText(result.text);
  } finally {
    await parser.destroy();
  }
}

export function buildKnowledgeDocumentIdentity(
  originalName: string,
  extension: KnowledgeDocumentExtension,
  createId: () => string = randomUUID,
) {
  const id = createId();
  const baseName = originalName
    .replace(/\.[^.]+$/, "")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255);
  const title = baseName || "Dokumen knowledge";
  const storagePath = `documents/${id}.${extension}`;

  return {
    title,
    sourceKey: storagePath,
    storagePath,
  };
}

export const KNOWLEDGE_DOCUMENT_UPLOAD_LIMIT_BYTES = MAX_UPLOAD_BYTES;
