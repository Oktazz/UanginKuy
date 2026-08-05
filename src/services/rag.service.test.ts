import { describe, expect, it, vi } from "vitest";

import {
  chunkKnowledgeText,
  ingestKnowledgeDocument,
  retrieveKnowledge,
  shouldRetrieveKnowledge,
  type RagDatabase,
} from "./rag.service";

const vector = Array.from({ length: 768 }, () => 0.01);

function createDatabaseMock(rows: Record<string, unknown>[] = []): RagDatabase & {
  query: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
} {
  const query = vi.fn().mockResolvedValue(rows);
  const transaction = vi.fn(async (operation) => operation({ query }));
  return { query, transaction };
}

describe("shouldRetrieveKnowledge", () => {
  it.each(["plastk", "syart pickup", "panduan", "harga kardus"]) (
    "uses semantic retrieval for short queries and typos: %s",
    (query) => expect(shouldRetrieveKnowledge(query)).toBe(true),
  );

  it.each(["", "ok", "halo", "terima kasih"]) (
    "skips empty acknowledgements and greetings: %s",
    (query) => expect(shouldRetrieveKnowledge(query)).toBe(false),
  );
});

describe("chunkKnowledgeText", () => {
  it("splits at word boundaries with bounded overlap", () => {
    const text = Array.from({ length: 80 }, (_, index) => `kata${index}`).join(" ");
    const chunks = chunkKnowledgeText(text, {
      size: 200,
      overlap: 20,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 200)).toBe(true);
    expect(
      chunks[1].split(" ").some((word) => chunks[0].split(" ").includes(word)),
    ).toBe(true);
  });

  it("rejects text that would exceed the chunk limit", () => {
    expect(() =>
      chunkKnowledgeText("a ".repeat(12_000), { size: 200, overlap: 0 }),
    ).toThrow("more than 100 chunks");
  });

  it("keeps every part of an overlong single word bounded", () => {
    expect(chunkKnowledgeText("x".repeat(250), { size: 200, overlap: 0 })).toEqual([
      "x".repeat(200),
      "x".repeat(50),
    ]);
  });
});

describe("retrieveKnowledge", () => {
  it("embeds the query and reads matching chunks directly from PostgreSQL", async () => {
    const database = createDatabaseMock([
      {
        content: "Botol PET diterima dalam keadaan bersih.",
        title: "Panduan Plastik",
        source_key: "documents/panduan.pdf",
        similarity: 0.92,
      },
    ]);
    const embed = vi.fn().mockResolvedValue(vector);

    await expect(
      retrieveKnowledge(
        { query: "botol pet", sessionId: "session-1" },
        { database, embed },
      ),
    ).resolves.toEqual({
      context: "Botol PET diterima dalam keadaan bersih.",
      sources: [
        {
          title: "Panduan Plastik",
          source: "documents/panduan.pdf",
          filename: "panduan.pdf",
          similarity: 0.92,
        },
      ],
    });

    expect(embed).toHaveBeenCalledWith("botol pet");
    expect(database.query).toHaveBeenCalledWith(
      expect.stringContaining("match_knowledge_chunks"),
      expect.arrayContaining([expect.stringContaining("[0.01")]),
    );
  });

  it("fails closed when the embedding provider returns the wrong vector dimension", async () => {
    const database = createDatabaseMock();

    await expect(
      retrieveKnowledge(
        { query: "panduan", sessionId: "session-1" },
        { database, embed: vi.fn().mockResolvedValue([0.1]) },
      ),
    ).resolves.toBeNull();
    expect(database.query).not.toHaveBeenCalled();
  });

  it("drops malformed source metadata and returns null for empty matches", async () => {
    const database = createDatabaseMock([
      { content: "", title: null, source_key: null, similarity: "unknown" },
    ]);

    await expect(
      retrieveKnowledge(
        { query: "panduan", sessionId: "session-1" },
        { database, embed: vi.fn().mockResolvedValue(vector) },
      ),
    ).resolves.toBeNull();
  });
});

describe("ingestKnowledgeDocument", () => {
  it("embeds chunks then replaces the document content inside one database transaction", async () => {
    const database = createDatabaseMock([{ id: "doc-123" }]);
    const embed = vi.fn().mockResolvedValue(vector);

    await expect(
      ingestKnowledgeDocument(
        {
          title: "Panduan Pemilahan",
          sourceKey: "documents/panduan.pdf",
          documentText: "Botol PET dipisahkan dari plastik lain.",
          metadata: { original_name: "panduan.pdf" },
        },
        { database, embed },
      ),
    ).resolves.toEqual({
      documentId: "doc-123",
      source: "documents/panduan.pdf",
      chunks: 1,
    });

    expect(database.transaction).toHaveBeenCalledOnce();
    expect(database.query).toHaveBeenCalledWith(
      expect.stringContaining("insert into public.knowledge_documents"),
      expect.arrayContaining(["Panduan Pemilahan", "documents/panduan.pdf"]),
    );
    expect(database.query).toHaveBeenCalledWith(
      expect.stringContaining("delete from public.knowledge_chunks"),
      ["doc-123"],
    );
  });

  it("does not mutate the database when a chunk embedding fails", async () => {
    const database = createDatabaseMock([{ id: "doc-123" }]);

    await expect(
      ingestKnowledgeDocument(
        {
          title: "Panduan",
          sourceKey: "documents/panduan.pdf",
          documentText: "Isi dokumen yang cukup singkat.",
          metadata: {},
        },
        { database, embed: vi.fn().mockRejectedValue(new Error("quota")) },
      ),
    ).resolves.toBeNull();
    expect(database.transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid documents before embedding or opening a transaction", async () => {
    const database = createDatabaseMock();
    const embed = vi.fn();

    await expect(
      ingestKnowledgeDocument(
        {
          title: "",
          sourceKey: "documents/panduan.pdf",
          documentText: "Isi dokumen.",
          metadata: {},
        },
        { database, embed },
      ),
    ).resolves.toBeNull();
    expect(embed).not.toHaveBeenCalled();
    expect(database.transaction).not.toHaveBeenCalled();
  });
});
