"use client";

import { X } from "lucide-react";
import { ChatbotIcon } from "./ChatbotIcon";

export function ChatHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
      style={{
        background: "#306D29",
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center p-1 flex-shrink-0 bg-white/95 shadow-xs"
      >
        <ChatbotIcon size={26} fill="#1a4c34" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-tight">
          UanginBot
        </p>
        <p className="text-white/70 text-xs">
          Asisten Sampah Pintar
        </p>
      </div>
      <button
        onClick={onClose}
        aria-label="Tutup chat"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
      >
        <X size={16} color="rgba(255,255,255,0.8)" />
      </button>
    </div>
  );
}