import { describe, expect, it } from "vitest";

import {
  buildChatMessageMetadata,
  normalizeChatSources,
  type ChatSource,
} from "./chat-source.service";

describe("chat source metadata", () => {
  it("normalizes source details for the chat history and UI", () => {
    expect(
      normalizeChatSources({
        sources: [
          {
            title: "  Panduan Pemilahan  ",
            filename: "panduan.pdf",
            similarity: 1.4,
          },
          {
            title: "",
            filename: "faq.docx",
            similarity: -0.2,
          },
          { title: 42, filename: 42 },
        ],
      }),
    ).toEqual([
      { title: "Panduan Pemilahan", filename: "panduan.pdf", similarity: 1 },
      { title: "faq.docx", filename: "faq.docx", similarity: 0 },
    ]);
  });

  it("limits sources and omits metadata when retrieval has no sources", () => {
    const sources: ChatSource[] = Array.from({ length: 8 }, (_, index) => ({
      title: `Dokumen ${index}`,
      filename: `dokumen-${index}.pdf`,
    }));

    expect(normalizeChatSources({ sources })).toHaveLength(5);
    expect(buildChatMessageMetadata([])).toEqual({});
    expect(buildChatMessageMetadata(sources)).toEqual({
      sources: sources.slice(0, 5),
    });
  });

  it("accepts an already stored source array for history loading", () => {
    expect(
      normalizeChatSources([
        { title: "FAQ", filename: "faq.pdf", similarity: 0.8 },
      ]),
    ).toEqual([{ title: "FAQ", filename: "faq.pdf", similarity: 0.8 }]);
  });
});
