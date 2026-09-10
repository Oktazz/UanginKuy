"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/ai-guardrails";

interface ChatInputProps {
  value: string;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatInput({
  value,
  isLoading,
  inputRef,
  onChange,
  onKeyDown,
  onSubmit,
}: ChatInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-end gap-2 px-3 py-3 border-t flex-shrink-0"
      style={{
        backgroundColor: "#ffffff",
        borderColor: "#E7E1B1",
      }}
    >
      <textarea
        ref={inputRef}
        value={value}
        maxLength={MAX_CHAT_MESSAGE_LENGTH}
        onChange={onChange}
        onKeyDown={onKeyDown}
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
      <Button
        type="submit"
        size="icon"
        disabled={!value.trim()}
        loading={isLoading}
        loadingLabel=""
        aria-label="Kirim pesan"
        className="flex-shrink-0 rounded-full transition-all hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:scale-100"
        style={{ backgroundColor: "#306D29", color: "#ffffff" }}
      >
        <Send size={15} />
      </Button>
    </form>
  );
}