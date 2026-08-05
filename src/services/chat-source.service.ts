export interface ChatSource {
  title: string;
  filename: string;
  similarity?: number;
}

export interface ChatMessageMetadata {
  sources?: ChatSource[];
}

const MAX_CHAT_SOURCES = 5;
const MAX_SOURCE_TEXT_LENGTH = 255;

function cleanSourceText(value: unknown) {
  return typeof value === "string"
    ? value.trim().slice(0, MAX_SOURCE_TEXT_LENGTH)
    : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeChatSources(value: unknown): ChatSource[] {
  const rawSources = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.sources)
      ? value.sources
      : [];

  return rawSources.slice(0, MAX_CHAT_SOURCES).flatMap((rawSource) => {
    if (!isRecord(rawSource)) return [];

    const rawTitle = cleanSourceText(rawSource.title);
    const rawFilename = cleanSourceText(rawSource.filename);
    if (!rawTitle && !rawFilename) return [];

    const title = rawTitle || rawFilename;
    const filename = rawFilename || rawTitle;
    const rawSimilarity = rawSource.similarity;
    const similarity =
      typeof rawSimilarity === "number" && Number.isFinite(rawSimilarity)
        ? Math.max(0, Math.min(1, rawSimilarity))
        : undefined;

    return [
      {
        title,
        filename,
        ...(similarity === undefined ? {} : { similarity }),
      },
    ];
  });
}

export function buildChatMessageMetadata(
  sources: readonly ChatSource[],
): ChatMessageMetadata {
  const normalizedSources = normalizeChatSources(sources);
  return normalizedSources.length ? { sources: normalizedSources } : {};
}
