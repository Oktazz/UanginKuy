"use client";

import { useCallback, useRef, useState } from "react";
import { normalizeChatSources } from "@/services/chat-source.service";
import type { ChatMessage } from "../types";

const genId = () => Math.random().toString(36).slice(2, 9);

/**
 * State & transport pesan chat + streaming SSE.
 * Preserves: fetch payload, AbortController, ReadableStream reader, SSE parsing,
 * rAF buffered flushing, final flush, cleanup, error handling, cancellation.
 */
export function useChatStream({ clearInput }: { clearInput: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef("");
  const streamMsgIdRef = useRef<string | null>(null);
  const streamRafRef = useRef<number | null>(null);

  // Batasi update ke SATU flush per frame — mencegah re-render penuh tiap chunk SSE
  const flushStream = useCallback(() => {
    streamRafRef.current = null;
    const msgId = streamMsgIdRef.current;
    const buffered = streamBufferRef.current;
    streamBufferRef.current = "";
    if (msgId && buffered) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: buffered, isStreaming: true } : m,
        ),
      );
    }
  }, []);

  const scheduleStreamFlush = useCallback(
    (msgId: string, textChunk: string) => {
      streamMsgIdRef.current = msgId;
      streamBufferRef.current += textChunk;
      if (streamRafRef.current === null) {
        streamRafRef.current = requestAnimationFrame(flushStream);
      }
    },
    [flushStream],
  );

  const cancelStreamFlush = useCallback(() => {
    if (streamRafRef.current !== null) {
      cancelAnimationFrame(streamRafRef.current);
      streamRafRef.current = null;
    }
    streamBufferRef.current = "";
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // Tambah pesan user
      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: trimmed,
      };

      // Siapkan pesan AI (kosong dulu, akan diisi lewat streaming)
      const botMsgId = genId();
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: "model",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);
      clearInput();
      setIsLoading(true);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok || !response.body) {
          const errorBody = await response.json().catch(() => null) as { error?: string } | null;
          const friendlyMessage = errorBody?.error ?? "Layanan AI sedang tidak tersedia.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, content: friendlyMessage, isStreaming: false }
                : m,
            ),
          );
          return;
        }

        // Baca SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulated += parsed.text;
                  // Throttle update: 1×/frame, bukan tiap chunk (~15ms)
                  scheduleStreamFlush(botMsgId, parsed.text);
                }
                if (parsed.sources) {
                  const sources = normalizeChatSources(parsed.sources);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId ? { ...m, sources } : m,
                    ),
                  );
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }

        // Flush sisa buffer, tandai selesai streaming
        cancelStreamFlush();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, content: accumulated, isStreaming: false } : m
          )
        );
      } catch (err: unknown) {
        cancelStreamFlush();
        if (err instanceof Error && err.name === "AbortError") return;

        console.error("[AiChatWidget] Error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content:
                    "Maaf, terjadi kesalahan. Silakan coba lagi dalam beberapa saat.",
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, scheduleStreamFlush, cancelStreamFlush, clearInput]
  );

  return { messages, setMessages, isLoading, sendMessage };
}