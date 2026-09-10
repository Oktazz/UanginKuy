// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatStream } from "@/components/ai-chat/hooks/useChatStream";

describe("useChatStream Hook", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("accumulates text progressively during streaming instead of overwriting", async () => {
    // Mock SSE stream with 3 consecutive text chunks
    const chunks = [
      'data: {"text":"Halo "}\n\n',
      'data: {"text":"Nasabah "}\n\n',
      'data: {"text":"UanginKuy!"}\n\n',
      "data: [DONE]\n\n",
    ];

    let chunkIndex = 0;
    const stream = new ReadableStream({
      pull(controller) {
        if (chunkIndex < chunks.length) {
          controller.enqueue(new TextEncoder().encode(chunks[chunkIndex++]));
        } else {
          controller.close();
        }
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    });

    const clearInput = vi.fn();
    const { result } = renderHook(() => useChatStream({ clearInput }));

    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage("Halo bot");
    });

    expect(clearInput).toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual({
      id: expect.any(String),
      role: "user",
      content: "Halo bot",
    });
    expect(result.current.messages[1]).toEqual({
      id: expect.any(String),
      role: "model",
      content: "",
      isStreaming: true,
    });

    // Wait for the stream processing to finish
    await act(async () => {
      await sendPromise;
    });

    // The final bot message should have the FULL accumulated text, not just the last chunk
    const botMessage = result.current.messages[1];
    expect(botMessage.content).toBe("Halo Nasabah UanginKuy!");
    expect(botMessage.isStreaming).toBe(false);
  });
});
