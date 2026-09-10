"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { normalizeChatSources } from "@/services/chat-source.service";
import type { ChatMessage } from "./types";
import { useChatStream } from "./hooks/useChatStream";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyLoadedRef = useRef(false); // Pastikan history hanya dimuat sekali

  const { messages, setMessages, isLoading, sendMessage } = useChatStream({
    clearInput: useCallback(() => setInput(""), []),
  });

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
  }, [isOpen, setMessages]);

  // Saat panel dibuka, fokus ke input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

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
          <ChatHeader onClose={() => setIsOpen(false)} />

          <ChatMessageList
            messages={messages}
            isLoadingHistory={isLoadingHistory}
            showScrollBtn={showScrollBtn}
            scrollContainerRef={scrollContainerRef}
            messagesEndRef={messagesEndRef}
            onScroll={handleScroll}
            onPrompt={sendMessage}
            scrollToBottom={() => scrollToBottom()}
          />

          <ChatInput
            value={input}
            isLoading={isLoading}
            inputRef={inputRef}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  );
}