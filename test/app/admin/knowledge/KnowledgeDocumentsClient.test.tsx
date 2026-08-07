import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import KnowledgeDocumentsClient, {
  type KnowledgeDocumentListItem,
} from "@/app/admin/knowledge/KnowledgeDocumentsClient";

const documents: KnowledgeDocumentListItem[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Panduan Pemilahan",
    sourceKey: "documents/panduan.pdf",
    originalName: "panduan.pdf",
    status: "active",
    chunks: 3,
    updatedAt: "2026-08-05T00:00:00.000Z",
  },
];

describe("KnowledgeDocumentsClient role controls", () => {
  it("renders preview-only controls for a regular admin", () => {
    const html = renderToStaticMarkup(
      <KnowledgeDocumentsClient documents={documents} canManage={false} />,
    );

    expect(html).toContain("akses baca-saja");
    expect(html).toContain("Preview Panduan Pemilahan");
    expect(html).not.toContain("knowledge-file");
    expect(html).not.toContain("Hapus Panduan Pemilahan");
  });

  it("renders upload and delete controls for a super admin", () => {
    const html = renderToStaticMarkup(
      <KnowledgeDocumentsClient documents={documents} canManage />,
    );

    expect(html).toContain("knowledge-file");
    expect(html).toContain("Upload &amp; Embed");
    expect(html).toContain("Hapus Panduan Pemilahan");
    expect(html).not.toContain("akses baca-saja");
  });
});
