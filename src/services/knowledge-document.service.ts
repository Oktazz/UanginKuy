import { randomUUID } from "node:crypto";

import mammoth from "mammoth";
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
