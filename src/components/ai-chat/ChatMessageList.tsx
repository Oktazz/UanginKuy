"use client";

import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import type { ChatMessage } from "./types";
import { EMPTY_SOURCES } from "./types";
import { BotBubble, TypingIndicator, UserBubble } from "./ChatBubble";

const SUGGESTED_PROMPTS = [
  "💰 Berapa saldo saya?",
  "🚚 Kapan kurir datang?",
  "♻️ Sampah apa yang paling banyak?",
  "📅 Jadwal pickup minggu ini?",
];

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoadingHistory: boolean;
  showScrollBtn: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onPrompt: (text: string) => void;
  scrollToBottom: () => void;
}

export function ChatMessageList({
  messages,
  isLoadingHistory,
  showScrollBtn,
  scrollContainerRef,
  messagesEndRef,
  onScroll,
  onPrompt,
  scrollToBottom,
}: ChatMessageListProps) {
  return (
    <>
      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
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
                  onClick={() => onPrompt(prompt)}
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
              sources={msg.sources ?? EMPTY_SOURCES}
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
    </>
  );
}