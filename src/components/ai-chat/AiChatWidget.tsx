"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ChatbotIcon } from "./ChatbotIcon";
import { normalizeChatSources } from "@/services/chat-source.service";
import type { ChatMessage, ChatSession } from "./types";
import { useChatStream } from "./hooks/useChatStream";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { ChatSessionList } from "./ChatSessionList";

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"chat" | "sessions">("chat");
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [activeSession, setActiveSession] = useState<{ id: string; title: string | null } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyLoadedRef = useRef(false);

  const {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    sessionId,
    setSessionId,
    resetChat,
  } = useChatStream({
    clearInput: useCallback(() => setInput(""), []),
  });

  // Auto-scroll ke bawah saat pesan baru masuk
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!isOpen || currentView !== "chat" || messages.length === 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    const lastMsg = messages[messages.length - 1];
    const isStreaming = lastMsg?.isStreaming;

    if (isStreaming) {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distFromBottom < 120) {
        el.scrollTop = el.scrollHeight;
      }
    } else {
      scrollToBottom("smooth");
    }
  }, [messages, isOpen, currentView, scrollToBottom]);

  // Deteksi scroll ke atas
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
  };

  // Muat daftar sesi dari server
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch("/api/ai/chat/sessions", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch (e) {
      console.error("[AiChatWidget] Failed to load sessions:", e);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Muat histori pesan sesi tertentu atau sesi terbaru
  const loadHistory = useCallback(
    async (targetSessionId?: string) => {
      setIsLoadingHistory(true);
      const url = targetSessionId
        ? `/api/ai/chat?sessionId=${targetSessionId}`
        : "/api/ai/chat";

      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          const data: {
            messages?: { id: string; role: string; content: string; metadata?: unknown }[];
            session?: { id: string; title: string | null };
          } = await res.json();

          if (data.messages) {
            const loaded: ChatMessage[] = data.messages.map((m) => ({
              id: m.id,
              role: m.role as "user" | "model",
              content: m.content,
              sources: normalizeChatSources(m.metadata),
            }));
            setMessages(loaded);
          } else {
            setMessages([]);
          }

          if (data.session) {
            setActiveSession(data.session);
            setSessionId(data.session.id);
          } else if (targetSessionId) {
            setActiveSession({ id: targetSessionId, title: "Percakapan Baru" });
            setSessionId(targetSessionId);
          }
        }
      } catch (e) {
        console.error("[AiChatWidget] Failed to load history:", e);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [setMessages, setSessionId],
  );

  // Saat panel pertama kali dibuka, muat histori dari DB
  useEffect(() => {
    if (!isOpen || historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    loadHistory();
  }, [isOpen, loadHistory]);

  // Saat panel dibuka atau beralih ke chat view, fokus ke input
  useEffect(() => {
    if (isOpen && currentView === "chat") {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, currentView]);

  // Handler: Buat Sesi Baru (New Chat)
  const handleNewChat = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/chat/sessions", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        resetChat();
        if (data.session) {
          setActiveSession(data.session);
          setSessionId(data.session.id);
          setSessions((prev) => [data.session, ...prev.filter((s) => s.id !== data.session.id)]);
        }
        setCurrentView("chat");
      }
    } catch (e) {
      console.error("[AiChatWidget] Failed to create new session:", e);
    }
  }, [resetChat, setSessionId]);

  // Handler: Pilih sesi lama dari daftar
  const handleSelectSession = useCallback(
    async (selectedSessionId: string) => {
      if (activeSession?.id === selectedSessionId) {
        setCurrentView("chat");
        return;
      }
      setCurrentView("chat");
      await loadHistory(selectedSessionId);
    },
    [activeSession, loadHistory],
  );

  // Handler: Hapus sesi percakapan
  const handleDeleteSession = useCallback(
    async (sessionIdToDelete: string) => {
      try {
        const res = await fetch(`/api/ai/chat/sessions?id=${sessionIdToDelete}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setSessions((prev) => prev.filter((s) => s.id !== sessionIdToDelete));

          // Jika sesi yang dihapus adalah sesi aktif saat ini
          if (activeSession?.id === sessionIdToDelete || sessionId === sessionIdToDelete) {
            const remaining = sessions.filter((s) => s.id !== sessionIdToDelete);
            if (remaining.length > 0) {
              await handleSelectSession(remaining[0].id);
            } else {
              resetChat();
              setActiveSession(null);
            }
          }
        }
      } catch (e) {
        console.error("[AiChatWidget] Failed to delete session:", e);
      }
    },
    [activeSession, sessionId, sessions, handleSelectSession, resetChat],
  );

  const handleToggleView = () => {
    if (currentView === "chat") {
      setCurrentView("sessions");
      loadSessions();
    } else {
      setCurrentView("chat");
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        id="tour-ai-chat"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Tutup chat AI" : "Buka UanginBot"}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-primary-dark active:scale-95 xl:bottom-6 xl:right-6"
      >
        <div
          className={`transition-all duration-300 ${isOpen ? "rotate-90 opacity-0 absolute" : "rotate-0 opacity-100"}`}
        >
          <ChatbotIcon size={34} fill="#ffffff" />
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
          <ChatHeader
            view={currentView}
            onToggleView={handleToggleView}
            onNewChat={handleNewChat}
            onClose={() => setIsOpen(false)}
            activeTitle={activeSession?.title || undefined}
          />

          {currentView === "chat" ? (
            <>
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
            </>
          ) : (
            <ChatSessionList
              sessions={sessions}
              activeSessionId={activeSession?.id ?? sessionId}
              isLoading={isLoadingSessions}
              onSelectSession={handleSelectSession}
              onNewChat={handleNewChat}
              onDeleteSession={handleDeleteSession}
            />
          )}
        </div>
      </div>
    </>
  );
}