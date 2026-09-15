"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  HelpCircle,
  Layers,
  Send,
  Truck,
  UserCheck,
} from "lucide-react";
import { ChatbotIcon } from "@/components/ai-chat/ChatbotIcon";
import { BotBubble, TypingIndicator, UserBubble } from "@/components/ai-chat/ChatBubble";
import { Button } from "@/components/ui/button";
import type { ChatSource } from "@/services/chat-source.service";

const emptySubscribe = () => () => {};

const MAX_FREE_QUESTIONS = 5;
const STORAGE_KEY = "uanginkuy_landing_edu_chat_v1";

const STARTER_PROMPTS = [
  {
    icon: HelpCircle,
    title: "Apa itu UanginKuy?",
    prompt: "Apa itu platform UanginKuy dan bagaimana cara kerjanya?",
  },
  {
    icon: Coins,
    title: "Sampah & Harga per Kg",
    prompt: "Sampah jenis apa saja yang diterima di UanginKuy beserta rincian harganya per kg?",
  },
  {
    icon: Layers,
    title: "Fitur Unggulan",
    prompt: "Apa saja fitur-fitur unggulan yang tersedia di aplikasi UanginKuy?",
  },
  {
    icon: Truck,
    title: "Alur Penjemputan",
    prompt: "Bagaimana alur penjemputan sampah dari rumah sampai saldo cair ke dompet?",
  },
];

interface ChatItem {
  id: string;
  role: "user" | "model";
  content: string;
  isStreaming?: boolean;
  sources?: ChatSource[];
}

const genId = () => Math.random().toString(36).slice(2, 9);

export function LandingEduChatSection() {
  const [messages, setMessages] = useState<ChatItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage?.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { messages?: ChatItem[] };
        if (Array.isArray(parsed.messages)) return parsed.messages;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [chatCount, setChatCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const stored = window.localStorage?.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { count?: number };
        if (typeof parsed.count === "number") return parsed.count;
      }
    } catch {
      // Fallback
    }
    return 0;
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isClientReady = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Simpan state ke localStorage saat messages atau chatCount berubah
  const saveToStorage = useCallback(
    (newMessages: ChatItem[], newCount: number) => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const cleanMessages = newMessages.map(({ id, role, content, sources }) => ({
            id,
            role,
            content,
            ...(sources && sources.length > 0 ? { sources } : {}),
          }));
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ messages: cleanMessages, count: newCount }),
          );
        }
      } catch {
        // Fallback hening
      }
    },
    [],
  );

  // Auto-scroll ke pesan terbaru
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      if (typeof scrollContainerRef.current.scrollTo === "function") {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Kirim pesan ke API AI Edukasi
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend ?? input;
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    if (chatCount >= MAX_FREE_QUESTIONS) {
      return;
    }

    setErrorMessage(null);
    setInput("");

    const newCount = chatCount + 1;
    setChatCount(newCount);

    const userMsg: ChatItem = {
      id: genId(),
      role: "user",
      content: trimmed,
    };

    const botMsgId = genId();
    const botMsg: ChatItem = {
      id: botMsgId,
      role: "model",
      content: "",
      isStreaming: true,
    };

    const nextMessages = [...messages, userMsg, botMsg];
    setMessages(nextMessages);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      // Ambil history percakapan sebelum pesan ini (max 6 pesan terakhir)
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/landing-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null) as { error?: string } | null;
        const fallbackMsg =
          res.status === 429
            ? "Terlalu banyak pesan dalam waktu singkat. Silakan tunggu 1 menit."
            : errorData?.error ?? "Layanan AI edukasi sedang sibuk. Silakan coba lagi.";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content: `⚠️ ${fallbackMsg}`,
                  isStreaming: false,
                }
              : m,
          ),
        );
        setIsLoading(false);
        saveToStorage(
          [
            ...messages,
            userMsg,
            { id: botMsgId, role: "model", content: `⚠️ ${fallbackMsg}` },
          ],
          newCount,
        );
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Respons streaming tidak dapat dibaca");
      }

      const decoder = new TextDecoder();
      const textChunks: string[] = [];
      let accumulatedSources: ChatSource[] | undefined = undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr) as {
              text?: string;
              sources?: ChatSource[];
            };
            if (parsed.text) {
              textChunks.push(parsed.text);
              const liveText = textChunks.join("");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId
                    ? { ...m, content: liveText, isStreaming: true }
                    : m,
                ),
              );
            }
            if (Array.isArray(parsed.sources) && parsed.sources.length > 0) {
              accumulatedSources = parsed.sources;
            }
          } catch {
            // Abaikan parse chunk yang tidak lengkap
          }
        }
      }

      // Selesai streaming
      const accumulatedText = textChunks.join("");
      const finalBotMsg: ChatItem = {
        id: botMsgId,
        role: "model",
        content:
          accumulatedText ||
          "Terima kasih atas pertanyaanmu seputar platform UanginKuy! 🌱",
        isStreaming: false,
        sources: accumulatedSources,
      };

      const finalMessages = [...messages, userMsg, finalBotMsg];
      setMessages(finalMessages);
      saveToStorage(finalMessages, newCount);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("[LandingEduChat] Error:", err);
      const failMsg: ChatItem = {
        id: botMsgId,
        role: "model",
        content: "Maaf, terjadi gangguan jaringan saat menghubungi AI. Silakan coba lagi sebentar ya! 🙏",
        isStreaming: false,
      };
      const errorMessages = [...messages, userMsg, failMsg];
      setMessages(errorMessages);
      saveToStorage(errorMessages, newCount);
    } finally {
      setIsLoading(false);
    }
  };

  const isLimitReached = isClientReady && chatCount >= MAX_FREE_QUESTIONS && !isLoading;

  return (
    <section id="tanya-ai" className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 scroll-mt-20">
      {/* Decorative ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
          Penasaran Soal UanginKuy?{" "} <br />
          <span className="text-primary">Tanya ke AI Langsung</span>
        </h2>
      </div>

      {/* Main Interactive Chat Card */}
      <div className="max-w-4xl mx-auto bg-surface rounded-3xl border border-border shadow-xl shadow-primary/5 overflow-hidden flex flex-col transition-all duration-300">
        {/* Card Header Bar */}
        <div className="bg-primary px-5 py-4 flex items-center justify-between text-primary-foreground flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/95 p-1.5 flex items-center justify-center shadow-xs flex-shrink-0">
              <ChatbotIcon size={24} fill="#0D530E" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm md:text-base leading-tight text-white">UanginBot</h3>
              </div>
              <p className="text-xs text-white/80 mt-0.5">Asisten Pintar Edukasi Sampah & UanginKuy</p>
            </div>
          </div>
        </div>

        {/* Card Body: Chat Scroll Area */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          aria-label="Riwayat percakapan AI Edukasi"
          className="h-[380px] md:h-[440px] overflow-y-auto p-4 md:p-6 space-y-4 bg-background/50 scroll-smooth focus:outline-none"
        >
          {/* Welcome Screen when messages are empty */}
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-3 py-6 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-2 text-white shadow-md mb-3.5">
                <ChatbotIcon size={34} fill="#ffffff" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-1.5">
                Halo! Mau tanya apa tentang <span className="text-bold text-primary">UanginKuy</span>? 👋
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-6 max-w-md leading-relaxed">
                Pilih salah satu contoh topik di bawah atau ketik pertanyaanmu secara langsung pada kotak pesan.
              </p>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {STARTER_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(item.prompt)}
                      disabled={isLoading}
                      aria-label={item.title}
                      className="flex items-start gap-3 text-left p-3.5 rounded-2xl bg-surface border border-border/80 hover:border-primary/50 hover:bg-primary/5 hover:shadow-xs text-foreground transition-all duration-200 group active:scale-[0.99] cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {item.prompt}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Conversation Messages */}
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
            ),
          )}

          {/* Conversion CTA Card inside conversation stream once quota is reached */}
          {isLimitReached && (
            <div className="my-6 p-6 md:p-7 rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl shadow-primary/10 border border-primary-dark/40 animate-fade-in">
              <h4 className="text-xl md:text-2xl font-extrabold text-white mb-2 tracking-tight">
                Siap Mengubah Sampah Menjadi Cuan?
              </h4>
              <p className="text-xs md:text-sm text-white/90 mb-6 max-w-xl leading-relaxed">
                Bergabunglah sekarang! Dapatkan akses penuh ke layanan penjemputan sampah dari rumah dan fitur lengkap aplikasi UanginKuy.
              </p>

              {/* Value proposition list */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="flex items-start gap-2.5 bg-white/10 rounded-xl p-3.5 backdrop-blur-xs border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-secondary-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/95 leading-snug">Penjemputan terjadwal langsung dari rumah</p>
                </div>
                <div className="flex items-start gap-2.5 bg-white/10 rounded-xl p-3.5 backdrop-blur-xs border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-secondary-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/95 leading-snug">Timbangan digital transparan & saldo instan</p>
                </div>
                <div className="flex items-start gap-2.5 bg-white/10 rounded-xl p-3.5 backdrop-blur-xs border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-secondary-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/95 leading-snug">Akses UanginBot penuh tanpa batas pesan</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary-light text-primary-dark px-6 py-3 rounded-xl font-bold text-sm hover:bg-secondary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95 shadow-md cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  Daftar Sekarang — Gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white px-6 py-3 rounded-xl font-semibold text-sm border border-white/30 transition-all duration-200 cursor-pointer"
                >
                  Masuk ke Akun
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Input Area or CTA Notice */}
        <div className="border-t border-border bg-surface p-3.5 md:p-4">
          {errorMessage && (
            <p className="text-xs text-destructive mb-2 px-1 font-medium">{errorMessage}</p>
          )}

          {isLimitReached ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/50 rounded-2xl p-3.5 px-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-foreground">
                    Tertarik mencoba layanan UanginKuy?
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Daftar akun gratis atau masuk untuk konsultasi tanpa batas dan jadwalkan penjemputan sampah ke rumahmu.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href="/register"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-dark transition-all shadow-xs cursor-pointer"
                >
                  Daftar Gratis
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/login"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center text-xs font-semibold px-4 py-2.5 rounded-xl bg-surface border border-border hover:bg-muted text-foreground transition-all cursor-pointer"
                >
                  Masuk
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                aria-label="Ketik pertanyaan untuk AI Edukasi"
                placeholder="Ketik pertanyaanmu seputar sampah atau UanginKuy (tekan Enter untuk kirim)..."
                rows={1}
                maxLength={1000}
                className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-xs md:text-sm outline-none border border-border bg-background text-foreground transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary min-h-[42px] max-h-[100px]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                loading={isLoading}
                loadingLabel=""
                aria-label="Kirim pertanyaan"
                className="rounded-xl w-11 h-11 flex-shrink-0 bg-primary hover:bg-primary-dark text-primary-foreground transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          )}

        </div>
      </div>
    </section>
  );
}
