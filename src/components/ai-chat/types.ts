import type { ChatSource } from "@/services/chat-source.service";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  isStreaming?: boolean;
  sources?: ChatSource[];
}

export interface ChatSession {
  id: string;
  title: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Referensi stabil agar React.memo efektif saat props sources tak berubah
export const EMPTY_SOURCES: ChatSource[] = [];