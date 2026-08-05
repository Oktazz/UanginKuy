"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Loader2, Sparkles, ChevronDown } from "lucide-react";

import {
  normalizeChatSources,
  type ChatSource,
} from "@/services/chat-source.service";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/ai-guardrails";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  isStreaming?: boolean;
  sources?: ChatSource[];
}

// ─── Helper: generate unique ID ───────────────────────────────────────────────

const genId = () => Math.random().toString(36).slice(2, 9);

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "💰 Berapa saldo saya?",
  "🚚 Kapan kurir datang?",
  "♻️ Sampah apa yang paling banyak?",
  "📅 Jadwal pickup minggu ini?",
];

// ─── Bubble Components ────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed"
        style={{
          backgroundColor: "#306D29",
          color: "#ffffff",
        }}
      >
        {content}
      </div>
    </div>
  );
}

/**
 * Parser markdown mini — mendukung **bold** dan *italic*.
 * Aman untuk digunakan saat streaming (teks parsial tidak akan crash).
 */
function renderMarkdown(text: string): React.ReactNode[] {
  // Regex: tangkap **bold**, *italic*, atau teks biasa secara bergantian
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Teks biasa sebelum match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      // **bold**
      parts.push(
        <strong key={match.index} style={{ fontWeight: 700 }}>
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined) {
      // *italic*
      parts.push(
        <em key={match.index}>{match[2]}</em>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  // Sisa teks setelah match terakhir
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Render teks multiline dengan dukungan markdown bold/italic.
 * Setiap baris diproses oleh renderMarkdown.
 */
function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {renderMarkdown(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}


function BotBubble({
  content,
  isStreaming,
  sources = [],
}: {
  content: string;
  isStreaming?: boolean;
  sources?: ChatSource[];
}) {
  return (
    <div className="flex items-start gap-2">
      {/* Bot avatar */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
        style={{ backgroundColor: "#E7E1B1" }}
      >
        <Bot size={14} style={{ color: "#306D29" }} />
      </div>

      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
        style={{
          backgroundColor: "#ffffff",
          color: "#1F2937",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <MarkdownText text={content} />
        {isStreaming && (
          <span
            className="inline-block w-1.5 h-4 ml-0.5 rounded-sm align-middle animate-pulse"
            style={{ backgroundColor: "#306D29" }}
          />
        )}
        {!isStreaming && sources.length > 0 && (
          <details className="mt-2 border-t border-gray-100 pt-2">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-gray-500 outline-none transition-colors hover:text-gray-700 focus-visible:text-gray-700 [&::-webkit-details-marker]:hidden">
              <span>Sumber ({sources.length})</span>
              <ChevronDown size={13} aria-hidden="true" />
            </summary>
            <ul className="mt-2 space-y-1.5 border-l-2 border-[#E7E1B1] pl-2.5 text-xs text-gray-500">
              {sources.map((source, index) => (
                <li key={`${source.filename}-${index}`}>
                  <p className="font-semibold text-gray-700">{source.title}</p>
                  <p className="truncate">{source.filename}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
        style={{ backgroundColor: "#E7E1B1" }}
      >
        <Bot size={14} style={{ color: "#306D29" }} />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: "#306D29",
              opacity: 0.7,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const historyLoadedRef = useRef(false); // Pastikan history hanya dimuat sekali

  // Auto-scroll ke bawah saat pesan baru masuk
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  // Deteksi apakah user scroll ke atas (tampilkan tombol scroll down)
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
  };

  // Saat panel pertama kali dibuka, muat histori dari DB
  useEffect(() => {
    if (!isOpen || historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    setIsLoadingHistory(true);
    fetch("/api/ai/chat")
      .then((res) => res.json())
      .then((data: { messages?: { id: string; role: string; content: string; metadata?: unknown }[] }) => {
        if (data.messages && data.messages.length > 0) {
          const loaded: ChatMessage[] = data.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "model",
            content: m.content,
            sources: normalizeChatSources(m.metadata),
          }));
          setMessages(loaded);
        }
      })
      .catch((e) => console.error("[AiChatWidget] Failed to load history:", e))
      .finally(() => setIsLoadingHistory(false));
  }, [isOpen]);

  // Saat panel dibuka, fokus ke input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // ─── Send Message ───────────────────────────────────────────────────────────

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
      setInput("");
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
                  // Update pesan AI secara real-time
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === botMsgId
                        ? { ...m, content: accumulated, isStreaming: true }
                        : m
                    )
                  );
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

        // Tandai selesai streaming
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (err: unknown) {
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
    [isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Tutup chat AI" : "Buka UanginBot"}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 xl:bottom-6 xl:right-6"
        style={{
          background: "linear-gradient(135deg, #306D29, #22C55E)",
          color: "#ffffff",
        }}
      >
        <div
          className={`transition-all duration-300 ${isOpen ? "rotate-90 opacity-0 absolute" : "rotate-0 opacity-100"}`}
        >
          <Sparkles size={22} />
        </div>
        <div
          className={`transition-all duration-300 ${isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0 absolute"}`}
        >
          <X size={22} />
        </div>
      </button>

      {/* ── Chat Panel ── */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-out
          bottom-36 right-4 xl:bottom-24 xl:right-6
          ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"}
        `}
        style={{ width: "min(380px, calc(100vw - 2rem))" }}
      >
        <div
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            height: "min(520px, calc(100dvh - 180px))",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(48,109,41,0.12)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #306D29 0%, #0D530E 100%)",
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Bot size={18} color="#ffffff" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">
                UanginBot
              </p>
              <p className="text-white/70 text-xs">
                Asisten Keuangan & Sampah Pintar
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Tutup chat"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            >
              <X size={16} color="rgba(255,255,255,0.8)" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
            style={{ backgroundColor: "#FBF5DD" }}
          >
            {/* Loading history state */}
            {isLoadingHistory && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 size={24} className="animate-spin" style={{ color: "#306D29" }} />
                <p className="text-sm text-gray-400">Memuat riwayat chat...</p>
              </div>
            )}

            {/* Welcome State (belum ada pesan & sudah selesai load) */}
            {!isLoadingHistory && messages.length === 0 && (

              <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #306D29, #22C55E)" }}
                >
                  <Sparkles size={30} color="#ffffff" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">
                    Hai! Aku UanginBot 👋
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tanyakan apa saja tentang saldo, tiket, atau jadwal pickupmu.
                  </p>
                </div>

                {/* Suggested Prompts */}
                <div className="w-full grid grid-cols-2 gap-2 mt-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-xs px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm hover:scale-[1.02] active:scale-95"
                      style={{
                        backgroundColor: "#ffffff",
                        borderColor: "#E7E1B1",
                        color: "#306D29",
                        fontWeight: 500,
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Bubbles */}
            {messages.map((msg) =>
              msg.role === "user" ? (
                <UserBubble key={msg.id} content={msg.content} />
              ) : msg.content === "" && msg.isStreaming ? (
                <TypingIndicator key={msg.id} />
              ) : (
                <BotBubble
                  key={msg.id}
                  content={msg.content}
                  isStreaming={msg.isStreaming}
                  sources={msg.sources}
                />
              )
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-16 right-4 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
              style={{ backgroundColor: "#306D29", color: "#fff" }}
              aria-label="Scroll ke bawah"
            >
              <ChevronDown size={16} />
            </button>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 px-3 py-3 border-t flex-shrink-0"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#E7E1B1",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              maxLength={MAX_CHAT_MESSAGE_LENGTH}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Tanya sesuatu..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none border transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "#FBF5DD",
                borderColor: "#E7E1B1",
                color: "#1F2937",
                maxHeight: "120px",
                lineHeight: "1.5",
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Kirim pesan"
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#306D29", color: "#ffffff" }}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
