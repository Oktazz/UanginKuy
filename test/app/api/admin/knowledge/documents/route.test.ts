import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  buildIdentityMock,
  createAdminClientMock,
  extractTextMock,
  ingestMock,
  getAuthenticatedProfileMock,
  validateUploadMock,
} = vi.hoisted(() => ({
  buildIdentityMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  extractTextMock: vi.fn(),
  ingestMock: vi.fn(),
  getAuthenticatedProfileMock: vi.fn(),
  validateUploadMock: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  getAuthenticatedProfile: getAuthenticatedProfileMock,
}));

vi.mock("@/services/knowledge-document.service", () => ({
  buildKnowledgeDocumentIdentity: buildIdentityMock,
  extractKnowledgeDocumentText: extractTextMock,
  validateKnowledgeUpload: validateUploadMock,
}));

vi.mock("@/services/rag.service", () => ({
  ingestKnowledgeDocument: ingestMock,
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import { POST } from "@/app/api/admin/knowledge/documents/route";

const storagePath = "documents/document-id.pdf";

function createUploadRequest() {
  const formData = new FormData();
  formData.set("title", "Panduan Pemilahan");
  formData.set(
    "file",
    new File([new Uint8Array([37, 80, 68, 70, 45, 49])], "panduan.pdf", {
      type: "application/pdf",
    }),
  );

  return new NextRequest("http://localhost/api/admin/knowledge/documents", {
    method: "POST",
    body: formData,
  });
}

function configureMocks(storedSize: number) {
  const storageBucket = {
    info: vi.fn().mockResolvedValue({
      data: { size: storedSize },
      error: null,
    }),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    upload: vi.fn().mockResolvedValue({
      data: { path: storagePath },
      error: null,
    }),
  };

  createAdminClientMock.mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue(storageBucket),
    },
  });

  return storageBucket;
}

describe("POST /api/admin/knowledge/documents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthenticatedProfileMock.mockResolvedValue({
      user: { id: "super-admin-id" },
      profile: { role: "super_admin" },
    });
    validateUploadMock.mockReturnValue({
      extension: "pdf",
      mimeType: "application/pdf",
    });
    extractTextMock.mockResolvedValue("Isi panduan.");
    buildIdentityMock.mockReturnValue({
      title: "panduan",
      sourceKey: storagePath,
      storagePath,
    });
    ingestMock.mockResolvedValue({
      documentId: "document-id",
      source: storagePath,
      chunks: 1,
    });
  });

  it("uploads the non-empty file body and verifies its stored size before embedding", async () => {
    const storageBucket = configureMocks(6);

    const response = await POST(createUploadRequest());

    expect(response.status).toBe(201);
    const uploadedBody = storageBucket.upload.mock.calls[0]?.[1];
    expect(uploadedBody).toBeInstanceOf(Blob);
    expect(uploadedBody.size).toBe(6);
    expect(storageBucket.info).toHaveBeenCalledWith(storagePath);
    expect(ingestMock).toHaveBeenCalledOnce();
  });

  it("does not embed or retain an empty object", async () => {
    const storageBucket = configureMocks(0);

    const response = await POST(createUploadRequest());

    expect(response.status).toBe(502);
    expect(ingestMock).not.toHaveBeenCalled();
    expect(storageBucket.remove).toHaveBeenCalledWith([storagePath]);
  });

  it("returns 403 for a regular admin without touching privileged services", async () => {
    getAuthenticatedProfileMock.mockResolvedValue({
      user: { id: "admin-id" },
      profile: { role: "admin" },
    });

    const response = await POST(createUploadRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Pengelolaan Knowledge AI hanya dapat dilakukan oleh super admin.",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(extractTextMock).not.toHaveBeenCalled();
    expect(ingestMock).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid session without touching privileged services", async () => {
    getAuthenticatedProfileMock.mockResolvedValue({
      user: null,
      profile: null,
    });

    const response = await POST(createUploadRequest());

    expect(response.status).toBe(401);
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(extractTextMock).not.toHaveBeenCalled();
    expect(ingestMock).not.toHaveBeenCalled();
  });
});
