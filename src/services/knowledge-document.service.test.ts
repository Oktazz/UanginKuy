import { describe, expect, it } from "vitest";

import {
  buildKnowledgeDocumentIdentity,
  normalizeExtractedDocumentText,
  validateKnowledgeUpload,
} from "./knowledge-document.service";

describe("validateKnowledgeUpload", () => {
  it("accepts a small PDF with matching extension, MIME type, and signature", () => {
    expect(
      validateKnowledgeUpload({
        name: "panduan-pemilahan.pdf",
        type: "application/pdf",
        size: 1024,
        signature: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      }),
    ).toEqual({ extension: "pdf", mimeType: "application/pdf" });
  });

  it("accepts DOCX from its ZIP signature", () => {
    expect(
      validateKnowledgeUpload({
        name: "SOP Pickup.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 2048,
        signature: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      }),
    ).toEqual({
      extension: "docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  });

  it.each([
    {
      name: "petunjuk.exe",
      type: "application/octet-stream",
      size: 1024,
      signature: new Uint8Array([0x4d, 0x5a]),
    },
    {
      name: "panduan.pdf",
      type: "application/pdf",
      size: 7 * 1024 * 1024,
      signature: new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    },
    {
      name: "panduan.pdf",
      type: "application/pdf",
      size: 1024,
      signature: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    },
  ])("rejects unsafe or malformed uploads: $name", (upload) => {
    expect(validateKnowledgeUpload(upload)).toBeNull();
  });
});

describe("normalizeExtractedDocumentText", () => {
  it("preserves paragraph boundaries while removing control characters and redundant whitespace", () => {
    expect(
      normalizeExtractedDocumentText("  Panduan\u0000 pemilahan  \n\n\n Botol  PET  "),
    ).toBe("Panduan pemilahan\n\nBotol PET");
  });

  it("returns null for empty or oversized extracted text", () => {
    expect(normalizeExtractedDocumentText(" ")).toBeNull();
    expect(normalizeExtractedDocumentText("x".repeat(100_001))).toBeNull();
  });
});

describe("buildKnowledgeDocumentIdentity", () => {
  it("creates a private storage path and a non-user-controlled source key", () => {
    const identity = buildKnowledgeDocumentIdentity("SOP Pickup Final.docx", "docx", () => "test-id");

    expect(identity).toEqual({
      sourceKey: "documents/test-id.docx",
      storagePath: "documents/test-id.docx",
      title: "SOP Pickup Final",
    });
  });
});
