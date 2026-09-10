"use client";

import Image from "next/image";
import { X } from "lucide-react";

export function ChatHeader({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
      style={{
        background: "linear-gradient(135deg, #306D29 0%, #0D530E 100%)",
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center p-1 flex-shrink-0"
        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
      >
        <Image
          src="/logo.png"
          alt="UanginBot"
          width={24}
          height={24}
          className="w-6 h-6 object-contain"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-tight">
          UanginBot
        </p>
        <p className="text-white/70 text-xs">
          Asisten Keuangan & Sampah Pintar
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