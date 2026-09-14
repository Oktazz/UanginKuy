"use client";

import { ArrowLeft, Menu, Plus, X } from "lucide-react";
import { ChatbotIcon } from "./ChatbotIcon";

interface ChatHeaderProps {
  view?: "chat" | "sessions";
  onToggleView?: () => void;
  onNewChat?: () => void;
  onClose: () => void;
  activeTitle?: string;
}

export function ChatHeader({
  view = "chat",
  onToggleView,
  onNewChat,
  onClose,
  activeTitle,
}: ChatHeaderProps) {
  const isSessionsView = view === "sessions";

  return (
    <div
      className="flex items-center gap-2.5 px-3 py-3 flex-shrink-0 select-none"
      style={{
        background: "#306D29",
      }}
    >
      {/* ── Left Toggle Button (Hamburger / Back) ── */}
      {onToggleView && (
        <button
          onClick={onToggleView}
          aria-label={isSessionsView ? "Kembali ke obrolan" : "Buka daftar riwayat sesi"}
          title={isSessionsView ? "Kembali ke obrolan" : "Riwayat sesi"}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
        >
          {isSessionsView ? <ArrowLeft size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* ── Bot Avatar ── */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center p-1 flex-shrink-0 bg-white/95 shadow-xs">
        <ChatbotIcon size={24} fill="#1a4c34" />
      </div>

      {/* ── Title & Subtitle ── */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-white font-semibold text-sm leading-tight truncate">
          {isSessionsView ? "Riwayat Sesi" : "UanginBot"}
        </p>
        <p className="text-white/75 text-xs truncate">
          {isSessionsView
            ? "Kelola percakapan"
            : activeTitle && activeTitle !== "Percakapan Baru" && activeTitle !== "UanginBot Chat"
            ? activeTitle
            : "Asisten Pengolahan Sampah"}
        </p>
      </div>

      {/* ── Action Buttons (New Chat + Close) ── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!isSessionsView && onNewChat && (
          <button
            onClick={onNewChat}
            aria-label="Mulai obrolan baru"
            title="Mulai obrolan baru"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus size={18} />
          </button>
        )}

        <button
          onClick={onClose}
          aria-label="Tutup chat"
          title="Tutup chat"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}