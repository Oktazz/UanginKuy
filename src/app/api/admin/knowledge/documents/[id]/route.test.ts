import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClientMock, requireAdminMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  requireAdminMock: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

import { GET } from "./route";

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
