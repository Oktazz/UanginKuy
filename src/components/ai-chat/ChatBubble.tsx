"use client";

import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { ChatbotIcon } from "./ChatbotIcon";
import type { ChatSource } from "@/services/chat-source.service";

// ─── Bubble Components (memoized: tak perlu re-render saat status lain berubah) ──

export const UserBubble = memo(function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed bg-primary text-primary-foreground shadow-xs">
        {content}
      </div>
    </div>
  );
});

/**
 * Memecah teks menjadi token kata dan spasi.
 * Saat isStreaming aktif, setiap kata dibungkus span beranimasi fade-in
 * dengan key stabil berbasis posisi agar kata sebelumnya tidak me-restart animasi.
 */
function renderFadeInTokens(
  text: string,
  baseKey: string,
  isStreaming?: boolean,
): React.ReactNode[] {
  if (!isStreaming) return [text];

  const tokens = text.split(/(\s+)/);
  return tokens.map((token, idx) => {
    if (!token) return null;
    if (/^\s+$/.test(token)) {
      return <span key={`${baseKey}-s-${idx}`}>{token}</span>;
    }
    return (
      <span
        key={`${baseKey}-w-${idx}`}
        className="inline-block animate-stream-word"
      >
        {token}
      </span>
    );
  });
}

/**
 * Parser markdown mini — mendukung **bold** dan *italic*.
 * Aman untuk digunakan saat streaming (teks parsial tidak akan crash).
 */
function renderMarkdown(
  text: string,
  lineIndex: number,
  isStreaming?: boolean,
): React.ReactNode[] {
  // Regex: tangkap **bold**, *italic*, atau teks biasa secara bergantian
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Teks biasa sebelum match
    if (match.index > lastIndex) {
      const plainText = text.slice(lastIndex, match.index);
      parts.push(
        ...renderFadeInTokens(
          plainText,
          `l${lineIndex}-p${lastIndex}`,
          isStreaming,
        ),
      );
    }

    if (match[1] !== undefined) {
      // **bold**
      parts.push(
        <strong key={`l${lineIndex}-b${match.index}`} style={{ fontWeight: 700 }}>
          {renderFadeInTokens(
            match[1],
            `l${lineIndex}-bi${match.index}`,
            isStreaming,
          )}
        </strong>,
      );
    } else if (match[2] !== undefined) {
      // *italic*
      parts.push(
        <em key={`l${lineIndex}-i${match.index}`}>
          {renderFadeInTokens(
            match[2],
            `l${lineIndex}-ii${match.index}`,
            isStreaming,
          )}
        </em>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  // Sisa teks setelah match terakhir
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(
      ...renderFadeInTokens(
        remainingText,
        `l${lineIndex}-tail`,
        isStreaming,
      ),
    );
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Render teks multiline dengan dukungan markdown bold/italic dan efek fade-in streaming.
 * Setiap baris diproses oleh renderMarkdown.
 */
function MarkdownText({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming?: boolean;
}) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {renderMarkdown(line, i, isStreaming)}
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
    <div className="flex items-start gap-2.5">
      {/* Bot avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center p-1 mt-0.5 bg-surface shadow-xs border border-border">
        <ChatbotIcon size={22} fill="#0D530E" />
      </div>

      <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed break-words bg-surface text-foreground shadow-xs border border-border/60">
        <MarkdownText text={content} isStreaming={isStreaming} />
        {!isStreaming && sources.length > 0 && (
          <details className="mt-2.5 border-t border-border/60 pt-2 group">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground [&::-webkit-details-marker]:hidden">
              <span>Sumber ({sources.length})</span>
              <ChevronDown size={13} aria-hidden="true" className="transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-2 space-y-1.5 border-l-2 border-primary/40 pl-2.5 text-xs text-muted-foreground">
              {sources.map((source, index) => (
                <li key={`${source.filename}-${index}`}>
                  <p className="font-semibold text-foreground">{source.title}</p>
                  <p className="truncate text-muted-foreground/80">{source.filename}</p>
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
    <div className="flex items-start gap-2.5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center p-1 mt-0.5 bg-surface shadow-xs border border-border">
        <ChatbotIcon size={22} fill="#0D530E" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 bg-surface border border-border/60 shadow-xs">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-pulse bg-primary/70"
            style={{
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}