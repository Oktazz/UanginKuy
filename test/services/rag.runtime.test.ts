import { afterEach, describe, expect, it, vi } from "vitest";

const vector = Array.from({ length: 768 }, () => 0.01);

afterEach(() => {
  vi.doUnmock("postgres");
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("direct RAG runtime adapters", () => {
  it("uses Gemini and a short-lived PostgreSQL connection when server env is configured", async () => {
    const unsafe = vi.fn().mockResolvedValue([
      {
        content: "Konteks langsung dari Supabase.",
        title: "FAQ",
        source_key: "documents/faq.pdf",
        metadata: { original_name: "faq-asli.pdf" },
        similarity: 0.9,
      },
    ]);
    const end = vi.fn().mockResolvedValue(undefined);
    const postgresClient = Object.assign(vi.fn(), {
      unsafe,
      begin: vi.fn(),
      end,
    });
    const postgresFactory = vi.fn(() => postgresClient);
    vi.doMock("postgres", () => ({ default: postgresFactory }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ embedding: { values: vector } }), { status: 200 }),
    ));
    vi.stubEnv("RAG_DATABASE_URL", "postgresql://rag:test@pooler.example.test:5432/postgres");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const { retrieveKnowledge } = await import("@/services/rag.service");
    await expect(
      retrieveKnowledge({ query: "panduan", sessionId: "session-1" }),
    ).resolves.toMatchObject({ context: "Konteks langsung dari Supabase." });

    expect(postgresFactory).toHaveBeenCalledWith(
      "postgresql://rag:test@pooler.example.test:5432/postgres",
      expect.objectContaining({ max: 1, prepare: false, ssl: "require" }),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("gemini-embedding-2:embedContent"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(unsafe).toHaveBeenCalledWith(
      expect.stringContaining("match_knowledge_chunks"),
      expect.any(Array),
    );
    expect(end).toHaveBeenCalledWith({ timeout: 1 });
  });

  it("uses a single transaction for direct ingestion and closes the connection", async () => {
    const query = vi.fn().mockResolvedValue([{ id: "doc-runtime" }]);
    const begin = vi.fn(async (operation) => operation({ unsafe: query }));
    const end = vi.fn().mockResolvedValue(undefined);
    const postgresClient = Object.assign(vi.fn(), {
      unsafe: query,
      begin,
      end,
    });
    vi.doMock("postgres", () => ({ default: vi.fn(() => postgresClient) }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ embedding: { values: vector } }), { status: 200 }),
    ));
    vi.stubEnv("RAG_DATABASE_URL", "postgresql://rag:test@pooler.example.test:5432/postgres");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const { ingestKnowledgeDocument } = await import("@/services/rag.service");
    await expect(
      ingestKnowledgeDocument({
        title: "FAQ",
        sourceKey: "documents/faq.pdf",
        documentText: "Isi FAQ UanginKuy.",
        metadata: {},
      }),
    ).resolves.toMatchObject({ documentId: "doc-runtime", chunks: 1 });

    expect(begin).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("insert into public.knowledge_documents"),
      expect.any(Array),
    );
    expect(end).toHaveBeenCalledWith({ timeout: 1 });
  });
});
