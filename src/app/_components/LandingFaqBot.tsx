"use client";

import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  Send,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Coins,
  Truck,
  Scale,
} from "lucide-react";
import { ChatbotIcon } from "@/components/ai-chat/ChatbotIcon";
import { BotBubble, TypingIndicator, UserBubble } from "@/components/ai-chat/ChatBubble";
import { Button } from "@/components/ui/button";
import type { ChatSource } from "@/services/chat-source.service";

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Bagaimana cara memesan penjemputan sampah ke rumah?",
    a: "Setelah membuat akun gratis di UanginKuy, kamu cukup membuka menu 'Booking Penjemputan', memilih jadwal operasional gudang cabang terdekat, dan menentukan titik alamat rumah. Sistem otomatis menerbitkan tiket digital dengan kode QR untuk diverifikasi kurir saat tiba.",
    category: "Alur Penjemputan",
  },
  {
    q: "Jenis sampah apa saja yang diterima oleh UanginKuy?",
    a: "Kami menerima berbagai kategori material bernilai daur ulang: botol & gelas plastik (PET, HDPE, PP), kertas & kardus tebal, kaleng logam & aluminium, minyak jelantah sisa dapur, hingga perangkat elektronik kecil. Katalog harga per kg selalu diperbarui secara transparan di aplikasi.",
    category: "Kategori Sampah",
  },
  {
    q: "Bagaimana proses penimbangan digital IoT dilakukan?",
    a: "Kurir kami tiba dengan membawa timbangan digital IoT terkalibrasi presisi tinggi. Saat sampah ditimbang per kategori, angka bobot langsung terkunci dan otomatis tersinkronisasi via internet ke server cloud dan struk aplikasi kamu, tanpa ada manipulasi atau pencatatan manual di kertas.",
    category: "Timbangan IoT",
  },
  {
    q: "Berapa lama saldo daur ulang bisa dicairkan?",
    a: "Saldo langsung masuk ke dompet akun UanginKuy kamu seketika setelah kurir menekan tombol selesai timbang. Kamu bisa menarik saldo tersebut kapan saja ke rekening bank nasional (BCA, Mandiri, BRI, BNI) atau e-wallet (GoPay, OVO, ShopeePay, DANA) dalam hitungan menit.",
    category: "Pencairan Saldo",
  },
  {
    q: "Apakah ada minimal berat sampah untuk penjemputan?",
    a: "Demi efisiensi rute kurir dan pengurangan emisi karbon, minimal penjemputan sampah rumah tangga adalah 5 kg untuk total seluruh kategori yang disetorkan. Jika belum mencapai 5 kg, kamu bisa menyimpannya sejenak atau membawanya langsung ke loket drop-off hub terdekat.",
    category: "Ketentuan Minimal",
  },
];

const STARTER_PROMPTS = [
  {
    icon: Coins,
    title: "Harga Sampah per Kg",
    prompt: "Berapa harga sampah plastik, kardus, dan minyak jelantah per kg saat ini?",
  },
  {
    icon: Truck,
    title: "Jadwal Penjemputan Bali",
    prompt: "Bagaimana alur dan wilayah penjemputan sampah di Bali?",
  },
  {
    icon: Scale,
    title: "Akurasi Timbangan IoT",
    prompt: "Bagaimana cara kerja timbangan IoT UanginKuy dalam mencegah kecurangan?",
  },
];

interface ChatItem {
  id: string;
  role: "user" | "model";
  content: string;
  isStreaming?: boolean;
  sources?: ChatSource[];
}

const emptySubscribe = () => () => {};
const MAX_FREE_QUESTIONS = 5;
const STORAGE_KEY = "uanginkuy_landing_faq_bot_v2";
const genId = () => Math.random().toString(36).slice(2, 9);

export function LandingFaqBot() {
  // Accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // UanginBot state
  const [messages, setMessages] = useState<ChatItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage?.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { messages?: ChatItem[] };
        if (Array.isArray(parsed.messages)) return parsed.messages;
      }
    } catch {
      // Ignore
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
      // Ignore
    }
    return 0;
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isClientReady = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const saveToStorage = useCallback((newMessages: ChatItem[], newCount: number) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const clean = newMessages.map(({ id, role, content, sources }) => ({
          id,
          role,
          content,
          ...(sources && sources.length > 0 ? { sources } : {}),
        }));
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: clean, count: newCount }));
      }
    } catch {
      // Ignore
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend ?? input;
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    if (chatCount >= MAX_FREE_QUESTIONS) return;

    setInput("");
    const newCount = chatCount + 1;
    setChatCount(newCount);

    const userMsg: ChatItem = { id: genId(), role: "user", content: trimmed };
    const botMsgId = genId();
    const botMsg: ChatItem = { id: botMsgId, role: "model", content: "", isStreaming: true };

    const nextMessages = [...messages, userMsg, botMsg];
    setMessages(nextMessages);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
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
            : errorData?.error ?? "Layanan UanginBot sedang sibuk. Silakan coba sesaat lagi ya!";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId ? { ...m, content: `⚠️ ${fallbackMsg}`, isStreaming: false } : m
          )
        );
        setIsLoading(false);
        saveToStorage(
          [...messages, userMsg, { id: botMsgId, role: "model", content: `⚠️ ${fallbackMsg}` }],
          newCount
        );
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Respons streaming tidak dapat dibaca");

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
            const parsed = JSON.parse(dataStr) as { text?: string; sources?: ChatSource[] };
            if (parsed.text) {
              textChunks.push(parsed.text);
              const liveText = textChunks.join("");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, content: liveText, isStreaming: true } : m
                )
              );
            }
            if (Array.isArray(parsed.sources) && parsed.sources.length > 0) {
              accumulatedSources = parsed.sources;
            }
          } catch {
            // Ignore parse chunk
          }
        }
      }

      const accumulatedText = textChunks.join("");
      const finalBotMsg: ChatItem = {
        id: botMsgId,
        role: "model",
        content: accumulatedText || "Semoga informasinya membantu ya! Ada lagi yang ingin kamu tanyakan? 🌱",
        isStreaming: false,
        sources: accumulatedSources,
      };

      const finalMessages = [...messages, userMsg, finalBotMsg];
      setMessages(finalMessages);
      saveToStorage(finalMessages, newCount);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[FaqBot] Error:", err);
      const failMsg: ChatItem = {
        id: botMsgId,
        role: "model",
        content: "Maaf, terjadi kendala jaringan saat menghubungi UanginBot. Silakan coba lagi ya! 🙏",
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
    <section id="faq" className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#eae5d8] text-xs font-medium text-primary mb-4 shadow-xs">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Pusat Bantuan & Konsultasi AI</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-snug mb-4">
          Pertanyaan umum & asisten UanginBot
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Temukan jawaban cepat seputar penjemputan sampah dari rumah, atau tanyakan langsung
          pertanyaan spesifikmu ke asisten pintar UanginBot di sebelah kanan.
        </p>
      </div>

      {/* 2-Column Side-by-Side: Left FAQ Accordion, Right UanginBot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column: FAQ Accordion */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="flex items-center justify-between pb-2 mb-2">
            <h3 className="font-semibold text-lg text-foreground tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h3>
            <span className="text-xs font-medium text-muted-foreground">
              {FAQS.length} Jawaban Lengkap
            </span>
          </div>

          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden bg-white ${
                  isOpen
                    ? "border-primary/40 shadow-md ring-1 ring-primary/10"
                    : "border-[#eae5d8] shadow-xs hover:border-primary/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left font-medium text-sm sm:text-base cursor-pointer focus:outline-none"
                >
                  <span
                    className={`transition-colors leading-snug ${
                      isOpen ? "text-primary font-semibold" : "text-foreground"
                    }`}
                  >
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? "bg-primary/10 text-primary rotate-180" : "bg-black/[0.04] text-muted-foreground"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Animated Accordion Content */}
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-[#f4f0e6]">
                      <p>{faq.a}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Kategori: {faq.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: UanginBot Interactive Chat Assistant Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#eae5d8] shadow-xs overflow-hidden flex flex-col">
          {/* Bot Card Header */}
          <div className="bg-[#fbf9f2] px-6 py-4 border-b border-[#eae5d8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center p-2 text-primary shrink-0">
                <ChatbotIcon size={24} fill="#306D29" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm sm:text-base text-foreground leading-none">
                    UanginBot AI
                  </h4>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Konsultasi jenis sampah, harga per kg, & jadwal penjemputan
                </p>
              </div>
            </div>

            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#eae5d8] text-primary">
              Online 24/7
            </span>
          </div>

          {/* Bot Chat Messages Scroll Body */}
          <div
            ref={scrollContainerRef}
            className="h-[360px] sm:h-[400px] overflow-y-auto p-5 space-y-3.5 bg-[#fdfbf7]/60 scroll-smooth focus:outline-none"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center p-2.5 mb-3 shadow-xs">
                  <ChatbotIcon size={28} fill="#306D29" />
                </div>
                <h5 className="font-semibold text-sm sm:text-base text-foreground mb-1">
                  Ada yang ingin kamu tanyakan ke <span className="text-primary font-semibold">UanginBot</span>?
                </h5>
                <p className="text-xs text-muted-foreground mb-5 max-w-sm">
                  Pilih pertanyaan populer di bawah atau ketik langsung pertanyaanmu seputar sampah.
                </p>

                {/* Quick Prompts */}
                <div className="w-full space-y-2 max-w-md">
                  {STARTER_PROMPTS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(item.prompt)}
                        disabled={isLoading}
                        className="w-full flex items-center gap-3 text-left p-3 rounded-2xl bg-white border border-[#eae5d8] hover:border-primary/40 hover:bg-[#fbf9f2] text-foreground text-xs font-medium transition-all group cursor-pointer shadow-2xs"
                      >
                        <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="flex-1 truncate">{item.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
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
              )
            )}

            {/* Quota limit card */}
            {isLimitReached && (
              <div className="p-4 rounded-2xl bg-white border border-primary/30 shadow-sm text-center">
                <p className="text-xs font-semibold text-foreground mb-1">
                  Kamu telah menggunakan 5 pertanyaan percobaan gratis
                </p>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Daftar akun sekarang untuk konsultasi tanpa batas dan mulai jadwal penjemputan dari rumah!
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-primary-dark transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Daftar Akun Gratis</span>
                </Link>
              </div>
            )}
          </div>

          {/* Bot Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-[#eae5d8]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
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
                disabled={isLoading || isLimitReached}
                placeholder={
                  isLimitReached
                    ? "Batas pertanyaan gratis tercapai. Silakan daftar akun."
                    : "Tanya UanginBot apa saja... (tekan Enter)"
                }
                rows={1}
                maxLength={500}
                className="flex-1 resize-none rounded-full px-4 py-2.5 text-xs sm:text-sm border border-[#eae5d8] bg-[#fdfbf7] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading || isLimitReached}
                loading={isLoading}
                loadingLabel=""
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-white shrink-0 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
