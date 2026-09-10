"use client";

import { memo } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import type { ChatSource } from "@/services/chat-source.service";

// ─── Bubble Components (memoized: tak perlu re-render saat status lain berubah) ──

export const UserBubble = memo(function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed"
        style={{
          backgroundColor: "#306D29",
          color: "#ffffff",
        }}
      >
        {content}
      </div>
    </div>
  );
});

/**
 * Parser markdown mini — mendukung **bold** dan *italic*.
 * Aman untuk digunakan saat streaming (teks parsial tidak akan crash).
 */
function renderMarkdown(text: string): React.ReactNode[] {
  // Regex: tangkap **bold**, *italic*, atau teks biasa secara bergantian
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Teks biasa sebelum match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      // **bold**
      parts.push(
        <strong key={match.index} style={{ fontWeight: 700 }}>
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined) {
      // *italic*
      parts.push(
        <em key={match.index}>{match[2]}</em>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  // Sisa teks setelah match terakhir
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Render teks multiline dengan dukungan markdown bold/italic.
 * Setiap baris diproses oleh renderMarkdown.
 */
function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {renderMarkdown(line)}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export const BotBubble = memo(function BotBubble({
  content,
  isStreaming,
  sources = [],
}: {
  content: string;
  isStreaming?: boolean;
  sources?: ChatSource[];
}) {
  return (
    <div className="flex items-start gap-2">
      {/* Bot avatar */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center p-0.5 mt-0.5"
        style={{ backgroundColor: "#E7E1B1" }}
      >
        <Image
          src="/logo.png"
          alt="UanginBot"
          width={20}
          height={20}
          className="w-5 h-5 object-contain"
        />
      </div>

      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
        style={{
          backgroundColor: "#ffffff",
          color: "#1F2937",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <MarkdownText text={content} />
        {isStreaming && (
          <span
            className="inline-block w-1.5 h-4 ml-0.5 rounded-sm align-middle animate-pulse"
            style={{ backgroundColor: "#306D29" }}
          />
        )}
        {!isStreaming && sources.length > 0 && (
          <details className="mt-2 border-t border-gray-100 pt-2">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-gray-500 outline-none transition-colors hover:text-gray-700 focus-visible:text-gray-700 [&::-webkit-details-marker]:hidden">
              <span>Sumber ({sources.length})</span>
              <ChevronDown size={13} aria-hidden="true" />
            </summary>
            <ul className="mt-2 space-y-1.5 border-l-2 border-[#E7E1B1] pl-2.5 text-xs text-gray-500">
              {sources.map((source, index) => (
                <li key={`${source.filename}-${index}`}>
                  <p className="font-semibold text-gray-700">{source.title}</p>
                  <p className="truncate">{source.filename}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
});

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center p-0.5 mt-0.5"
        style={{ backgroundColor: "#E7E1B1" }}
      >
        <Image
          src="/logo.png"
          alt="UanginBot"
          width={20}
          height={20}
          className="w-5 h-5 object-contain"
        />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{
              backgroundColor: "#306D29",
              opacity: 0.7,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}