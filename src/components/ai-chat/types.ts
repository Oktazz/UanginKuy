import type { ChatSource } from "@/services/chat-source.service";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  isStreaming?: boolean;
  sources?: ChatSource[];
}

// Referensi stabil agar React.memo efektif saat props sources tak berubah
export const EMPTY_SOURCES: ChatSource[] = [];