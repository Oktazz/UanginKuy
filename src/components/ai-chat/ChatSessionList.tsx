"use client";

import { useState } from "react";
import { MessageSquare, Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import type { ChatSession } from "./types";

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
}

function formatSessionDate(dateString?: string | null): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);

    if (isToday) {
      return `Hari ini, ${timeStr}`;
    }

    if (isYesterday) {
      return `Kemarin, ${timeStr}`;
    }

    const dateStr = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(date);

    return `${dateStr}, ${timeStr}`;
  } catch {
    return "";
  }
}

export function ChatSessionList({
  sessions,
  activeSessionId,
  isLoading,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: ChatSessionListProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeletingId(sessionId);
    try {
      await onDeleteSession(sessionId);
    } finally {
      setIsDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#FBF5DD" }}
    >
      {/* ── Action Top Bar ── */}
      <div className="p-3 border-b border-amber-900/10 flex-shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-medium text-sm transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
          style={{ background: "#306D29" }}
        >
          <Plus size={18} />
          <span>Obrolan Baru</span>
        </button>
      </div>

      {/* ── Sessions List ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 size={24} className="animate-spin text-[#306D29]" />
            <p className="text-xs text-stone-500 font-medium">Memuat riwayat sesi...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-center px-4 gap-3">
            <div className="w-12 h-12 rounded-full bg-white/80 border border-amber-900/10 flex items-center justify-center text-[#306D29]">
              <MessageSquare size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800">Belum Ada Riwayat Sesi</p>
              <p className="text-xs text-stone-500 mt-1 max-w-[240px]">
                Mulai percakapan baru untuk bertanya seputar sampah, koin, atau jadwal kurir.
              </p>
            </div>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isConfirming = confirmDeleteId === session.id;
            const isDeleting = isDeletingId === session.id;
            const title = session.title?.trim() || "Percakapan Baru";
            const dateDisplay = formatSessionDate(session.updated_at || session.created_at);

            return (
              <div
                key={session.id}
                onClick={() => !isConfirming && !isDeleting && onSelectSession(session.id)}
                className={`group relative rounded-xl p-3 border transition-all duration-200 text-left ${
                  isActive
                    ? "bg-white border-[#306D29] shadow-xs"
                    : "bg-white/80 hover:bg-white border-amber-900/10 hover:border-amber-900/20 cursor-pointer shadow-2xs"
                }`}
              >
                {isConfirming ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between gap-2 p-1 text-xs"
                  >
                    <div className="flex items-center gap-1.5 text-rose-700 font-medium min-w-0">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span className="truncate">Hapus sesi ini?</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                        disabled={isDeleting}
                        className="px-2 py-1 rounded-md text-stone-600 bg-stone-100 hover:bg-stone-200 font-medium transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        disabled={isDeleting}
                        className="px-2 py-1 rounded-md text-white bg-rose-600 hover:bg-rose-700 font-medium transition-colors flex items-center gap-1"
                      >
                        {isDeleting && <Loader2 size={12} className="animate-spin" />}
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare
                          size={14}
                          className={isActive ? "text-[#306D29]" : "text-stone-400"}
                        />
                        <span className="font-semibold text-xs text-stone-800 truncate block">
                          {title}
                        </span>
                        {isActive && (
                          <span className="flex-shrink-0 text-[10px] font-semibold bg-[#306D29]/10 text-[#306D29] px-1.5 py-0.2 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                      {dateDisplay && (
                        <p className="text-[11px] text-stone-500 pl-5">
                          {dateDisplay}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(session.id);
                      }}
                      title="Hapus sesi"
                      aria-label="Hapus sesi"
                      className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
