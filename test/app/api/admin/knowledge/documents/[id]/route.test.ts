import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock, getAuthenticatedProfileMock, requireAdminMock } =
  vi.hoisted(() => ({
    createAdminClientMock: vi.fn(),
    getAuthenticatedProfileMock: vi.fn(),
    requireAdminMock: vi.fn(),
  }));

vi.mock("@/lib/auth/authorization", () => ({
  getAuthenticatedProfile: getAuthenticatedProfileMock,
  requireAdmin: requireAdminMock,
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import { DELETE, GET } from "@/app/api/admin/knowledge/documents/[id]/route";

const documentId = "11111111-1111-4111-8111-111111111111";
const storagePath = `documents/${documentId}.pdf`;

function createDocumentQuery() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

describe("GET /api/admin/knowledge/documents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ user: { id: "admin-id" } });
    getAuthenticatedProfileMock.mockResolvedValue({
      user: { id: "super-admin-id" },
      profile: { role: "super_admin" },
    });
  });

  it("serves the stored PDF inline for browser preview", async () => {
    const documentQuery = createDocumentQuery();
    documentQuery.maybeSingle.mockResolvedValue({
      data: {
        id: documentId,
        title: "Panduan Pemilahan",
        source_key: storagePath,
        metadata: {
          original_name: "panduan pemilahan.pdf",
          mime_type: "application/pdf",
          storage_path: storagePath,
        },
      },
      error: null,
    });

    const storageBucket = {
      download: vi.fn().mockResolvedValue({
        data: new Blob(["%PDF-1.7 preview"], { type: "application/pdf" }),
        error: null,
      }),
    };
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(documentQuery),
      storage: {
        from: vi.fn().mockReturnValue(storageBucket),
      },
    });

    const response = await GET(
      new NextRequest(
        `http://localhost/api/admin/knowledge/documents/${documentId}?format=file`,
      ),
      { params: Promise.resolve({ id: documentId }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      "inline; filename*=UTF-8''panduan%20pemilahan.pdf",
    );
    expect(await response.text()).toBe("%PDF-1.7 preview");
    expect(storageBucket.download).toHaveBeenCalledWith(storagePath);
  });
});

describe("DELETE /api/admin/knowledge/documents/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows a super admin to delete the document and stored file", async () => {
    getAuthenticatedProfileMock.mockResolvedValue({
      user: { id: "super-admin-id" },
      profile: { role: "super_admin" },
    });

    const documentQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: documentId,
          source_key: storagePath,
          metadata: { storage_path: storagePath },
        },
        error: null,
      }),
      delete: vi.fn(),
    };
    documentQuery.select.mockReturnValue(documentQuery);
    documentQuery.delete.mockReturnValue(documentQuery);
    documentQuery.eq.mockReturnValue(documentQuery);
    const storageBucket = {
      remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue(documentQuery),
      storage: { from: vi.fn().mockReturnValue(storageBucket) },
    });

    const response = await DELETE(
      new NextRequest(
        `http://localhost/api/admin/knowledge/documents/${documentId}`,
        { method: "DELETE" },
      ),
      { params: Promise.resolve({ id: documentId }) },
    );

    expect(response.status).toBe(204);
    expect(documentQuery.delete).toHaveBeenCalledOnce();
    expect(storageBucket.remove).toHaveBeenCalledWith([storagePath]);
  });

  it("returns 403 for a regular admin without touching the database", async () => {
    getAuthenticatedProfileMock.mockResolvedValue({
      user: { id: "admin-id" },
      profile: { role: "admin" },
    });

    const response = await DELETE(
      new NextRequest(
        `http://localhost/api/admin/knowledge/documents/${documentId}`,
        {
          method: "DELETE",
        },
      ),
      { params: Promise.resolve({ id: documentId }) },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Pengelolaan Knowledge AI hanya dapat dilakukan oleh super admin.",
    });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid session without touching the database", async () => {
    getAuthenticatedProfileMock.mockResolvedValue({
      user: null,
      profile: null,
    });

    const response = await DELETE(
      new NextRequest(
        `http://localhost/api/admin/knowledge/documents/${documentId}`,
        {
          method: "DELETE",
        },
      ),
      { params: Promise.resolve({ id: documentId }) },
    );

    expect(response.status).toBe(401);
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });
});
