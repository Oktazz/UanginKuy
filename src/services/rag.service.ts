import { createHash } from "node:crypto";

import postgres from "postgres";

export interface RagSource {
  title: string;
  source: string;
  similarity?: number;
}

export interface RagRetrievalResult {
  context: string;
  sources: RagSource[];
}

export interface RetrieveKnowledgeInput {
  query: string;
  sessionId: string;
}

export interface KnowledgeIngestionInput {
  title: string;
  sourceKey: string;
  documentText: string;
  metadata: Record<string, unknown>;
  sessionId?: string;
}

export interface KnowledgeIngestionResult {
  documentId: string;
  source: string;
  chunks: number;
}

export interface RagTransaction {
  query<Row extends Record<string, unknown>>(
    statement: string,
    parameters: readonly RagParameter[],
  ): Promise<Row[]>;
}

export interface RagDatabase extends RagTransaction {
  transaction<T>(operation: (transaction: RagTransaction) => Promise<T>): Promise<T>;
}

type Embed = (text: string) => Promise<number[]>;
export type RagParameter =
  | string
  | number
  | boolean
  | null
  | readonly RagParameter[]
  | { toJSON(): unknown };

interface RagDependencies {
  database?: RagDatabase;
  embed?: Embed;
}

const EMBEDDING_DIMENSIONS = 768;
const MAX_QUERY_LENGTH = 2_000;
const MAX_CONTEXT_LENGTH = 12_000;
const MAX_SOURCES = 5;
const MAX_SOURCE_FIELD_LENGTH = 300;
const MAX_DOCUMENT_TEXT_LENGTH = 100_000;
const MAX_DOCUMENT_TITLE_LENGTH = 255;
const MAX_SOURCE_KEY_LENGTH = 500;
const MAX_METADATA_LENGTH = 8_000;
const DEFAULT_CHUNK_SIZE = 1_200;
const DEFAULT_CHUNK_OVERLAP = 200;
const MAX_CHUNKS = 100;
const GREETING_OR_ACKNOWLEDGEMENT =
  /^(?:halo|hai|hi|helo|hallo|pagi|siang|sore|malam|ok|oke|okay|makasih|terima kasih|thanks|thx)[!.,\s🙂😊🙏]*$/i;

interface RuntimeDatabase extends RagDatabase {
  close(): Promise<void>;
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function vectorLiteral(vector: readonly number[]): string {
  if (
    vector.length !== EMBEDDING_DIMENSIONS ||
    vector.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("Embedding Gemini tidak memiliki 768 dimensi yang valid.");
  }

  return `[${vector.map((value) => Number(value).toString()).join(",")}]`;
}

function runtimeConfig() {
  const databaseUrl = process.env.RAG_DATABASE_URL?.trim() ?? "";
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  return databaseUrl && apiKey ? { databaseUrl, apiKey } : null;
}

function createRuntimeDatabase(connectionString: string): RuntimeDatabase {
  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 10,
    ssl: "require",
  });

  const asTransaction = (
    connection: Pick<postgres.Sql, "unsafe"> | Pick<postgres.TransactionSql, "unsafe">,
  ): RagTransaction => ({
    query: async <Row extends Record<string, unknown>>(
      statement: string,
      parameters: readonly RagParameter[],
    ) =>
      connection.unsafe(statement, [...parameters] as never[]) as unknown as Promise<Row[]>,
  });

  return {
    ...asTransaction(client),
    transaction: async <T>(operation: (transaction: RagTransaction) => Promise<T>) =>
      client.begin(async (transaction) => operation(asTransaction(transaction))) as Promise<T>,
    close: async () => client.end({ timeout: 1 }),
  };
}

function createGeminiEmbedder(apiKey: string): Embed {
  return async (text: string) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini embedding request failed (${response.status}).`);
    }

    const payload = (await response.json()) as {
      embedding?: { values?: unknown };
    };
    return Array.isArray(payload.embedding?.values)
      ? payload.embedding.values.filter(
          (value): value is number => typeof value === "number",
        )
      : [];
  };
}

async function withDependencies<T>(
  dependencies: RagDependencies,
  operation: (database: RagDatabase, embed: Embed) => Promise<T>,
): Promise<T | null> {
  const config = dependencies.database && dependencies.embed ? null : runtimeConfig();
  const database = dependencies.database ?? (config ? createRuntimeDatabase(config.databaseUrl) : null);
  const embed = dependencies.embed ?? (config ? createGeminiEmbedder(config.apiKey) : null);

  if (!database || !embed) return null;

  try {
    return await operation(database, embed);
  } catch (error) {
    console.warn("[RAG] Direct retrieval or ingestion failed", {
      reason: error instanceof Error ? error.name : "unknown_error",
    });
    return null;
  } finally {
    if (!dependencies.database && database instanceof Object && "close" in database) {
      await (database as RuntimeDatabase).close();
    }
  }
}

export function shouldRetrieveKnowledge(query: string): boolean {
  const normalized = query.trim();
  return normalized.length >= 3 && !GREETING_OR_ACKNOWLEDGEMENT.test(normalized);
}

export function chunkKnowledgeText(
  text: string,
  options: { size?: number; overlap?: number } = {},
): string[] {
  const size = Math.max(200, Math.min(4_000, options.size ?? DEFAULT_CHUNK_SIZE));
  const overlap = Math.max(0, Math.min(size - 1, options.overlap ?? DEFAULT_CHUNK_OVERLAP));
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const chunks: string[] = [];
  let current: string[] = [];

  const emit = () => {
    if (!current.length) return;
    chunks.push(current.join(" "));
    if (chunks.length > MAX_CHUNKS) {
      throw new Error("Document produces more than 100 chunks.");
    }

    if (!overlap) {
      current = [];
      return;
    }

    const tail: string[] = [];
    let tailLength = 0;
    for (let index = current.length - 1; index >= 0; index -= 1) {
      const word = current[index];
      const nextLength = tailLength + word.length + (tail.length ? 1 : 0);
      if (nextLength > overlap) break;
      tail.unshift(word);
      tailLength = nextLength;
    }
    current = tail;
  };

  for (const word of words) {
    if (word.length > size) {
      if (current.length) emit();
      for (let offset = 0; offset < word.length; offset += size) {
        chunks.push(word.slice(offset, offset + size));
        if (chunks.length > MAX_CHUNKS) {
          throw new Error("Document produces more than 100 chunks.");
        }
      }
      current = [];
      continue;
    }

    const candidate = [...current, word].join(" ");
    if (candidate.length > size && current.length) emit();
    current.push(word);
  }
  emit();
  return chunks;
}

function normalizeSources(rows: Record<string, unknown>[]): RagSource[] {
  return rows.slice(0, MAX_SOURCES).flatMap((row) => {
    const title = cleanText(row.title, MAX_SOURCE_FIELD_LENGTH);
    const source = cleanText(row.source_key, MAX_SOURCE_FIELD_LENGTH);
    const rawSimilarity = row.similarity;
    const similarity =
      typeof rawSimilarity === "number" && Number.isFinite(rawSimilarity)
        ? Math.max(0, Math.min(1, rawSimilarity))
        : undefined;

    if (!title && !source) return [];
    return [
      {
        title: title || source,
        source: source || title,
        ...(similarity === undefined ? {} : { similarity }),
      },
    ];
  });
}

export async function retrieveKnowledge(
  input: RetrieveKnowledgeInput,
  dependencies: RagDependencies = {},
): Promise<RagRetrievalResult | null> {
  const query = cleanText(input.query, MAX_QUERY_LENGTH);
  if (!query) return null;

  return withDependencies(dependencies, async (database, embed) => {
    const embedding = vectorLiteral(await embed(query));
    const rows = await database.query<Record<string, unknown>>(
      `select content, title, source_key, similarity
       from public.match_knowledge_chunks(
         $1::extensions.vector(768), $2, $3, '{}'::jsonb
       )`,
      [embedding, 0.68, 8],
    );
    const context = rows
      .map((row) => cleanText(row.content, MAX_CONTEXT_LENGTH))
      .filter(Boolean)
      .join("\n\n---\n\n")
      .slice(0, MAX_CONTEXT_LENGTH);

    return context ? { context, sources: normalizeSources(rows) } : null;
  });
}

async function embedChunks(chunks: string[], embed: Embed): Promise<string[]> {
  const concurrency = 4;
  const vectors = new Array<string>(chunks.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, chunks.length) }, async () => {
      while (nextIndex < chunks.length) {
        const index = nextIndex;
        nextIndex += 1;
        vectors[index] = vectorLiteral(await embed(chunks[index]));
      }
    }),
  );
  return vectors;
}

function prepareIngestion(input: KnowledgeIngestionInput) {
  const title = input.title.trim();
  const sourceKey = input.sourceKey.trim();
  const documentText = input.documentText.trim();
  const metadata = JSON.stringify(input.metadata);

  if (
    !title ||
    title.length > MAX_DOCUMENT_TITLE_LENGTH ||
    !sourceKey ||
    sourceKey.length > MAX_SOURCE_KEY_LENGTH ||
    !documentText ||
    documentText.length > MAX_DOCUMENT_TEXT_LENGTH ||
    metadata.length > MAX_METADATA_LENGTH
  ) {
    return null;
  }

  return { title, sourceKey, documentText, metadata };
}

export async function ingestKnowledgeDocument(
  input: KnowledgeIngestionInput,
  dependencies: RagDependencies = {},
): Promise<KnowledgeIngestionResult | null> {
  const prepared = prepareIngestion(input);
  if (!prepared) return null;

  return withDependencies(dependencies, async (database, embed) => {
    const chunks = chunkKnowledgeText(prepared.documentText);
    const vectors = await embedChunks(chunks, embed);
    const checksum = createHash("sha256").update(prepared.documentText).digest("hex");

    const documentId = await database.transaction(async (transaction) => {
      const rows = await transaction.query<{ id: string }>(
        `insert into public.knowledge_documents (
           title, source_key, checksum, metadata, status
         )
         values ($1, $2, $3, $4::jsonb, 'active')
         on conflict (source_key) do update
         set title = excluded.title,
             checksum = excluded.checksum,
             metadata = excluded.metadata,
             status = 'active',
             updated_at = now()
         returning id`,
        [prepared.title, prepared.sourceKey, checksum, prepared.metadata],
      );
      const id = rows[0]?.id;
      if (!id) throw new Error("Knowledge document was not returned by PostgreSQL.");

      await transaction.query(
        "delete from public.knowledge_chunks where document_id = $1",
        [id],
      );

      for (let index = 0; index < chunks.length; index += 1) {
        await transaction.query(
          `insert into public.knowledge_chunks (
             document_id, chunk_index, content, embedding
           )
           values ($1, $2, $3, $4::extensions.vector(768))`,
          [id, index, chunks[index], vectors[index]],
        );
      }
      return id;
    });

    return {
      documentId,
      source: prepared.sourceKey,
      chunks: chunks.length,
    };
  });
}
