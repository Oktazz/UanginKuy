"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  Minus,
  Sparkles,
  X,
} from "lucide-react";
import { formatBytes } from "@/utils/format";
import type { UploadQueueItem } from "./knowledge-upload-context";

interface UploadQueueWidgetProps {
  queue: UploadQueueItem[];
  isProcessing: boolean;
  isMinimized: boolean;
  onSetMinimized: (val: boolean) => void;
  onClearCompleted: () => void;
}

export function UploadQueueWidget({
  queue,
  isProcessing,
  isMinimized,
  onSetMinimized,
  onClearCompleted,
}: UploadQueueWidgetProps) {
  const totalCount = queue.length;
  const completedCount = queue.filter(
    (item) => item.status === "success",
  ).length;
  const errorCount = queue.filter((item) => item.status === "error").length;
  const doneCount = completedCount + errorCount;
  const progressPercentage =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const currentProcessingItem = queue.find(
    (item) => item.status === "processing",
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col justify-end p-4 sm:p-6">
      {isMinimized ? (
        /* Mode Minimized: Kontainer kecil melayang di pojok kanan bawah */
        <div className="pointer-events-auto ml-auto flex max-w-sm items-center gap-3 rounded-2xl border border-gray-200/90 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-center">
            {isProcessing ? (
              <Loader2
                size={20}
                className="animate-spin text-primary"
                aria-hidden="true"
              />
            ) : errorCount > 0 ? (
              <AlertCircle
                size={20}
                className="text-error"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2
                size={20}
                className="text-success"
                aria-hidden="true"
              />
            )}
          </div>

          <div
            className="min-w-0 cursor-pointer"
            onClick={() => onSetMinimized(false)}
            role="button"
            tabIndex={0}
            aria-label="Buka detail proses embedding"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSetMinimized(false);
              }
            }}
          >
            <p className="truncate text-xs font-bold text-gray-900">
              {isProcessing
                ? `Embedding (${doneCount + 1}/${totalCount})`
                : `Selesai (${completedCount}/${totalCount})`}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 sm:w-32">
                <div
                  className={`h-full transition-all duration-300 ${
                    errorCount > 0 && !isProcessing
                      ? "bg-amber-500"
                      : "bg-primary"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-[10px] font-extrabold text-gray-500">
                {progressPercentage}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-gray-100 pl-2">
            <button
              type="button"
              aria-label="Perbesar tampilan"
              onClick={() => onSetMinimized(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronUp size={16} />
            </button>
            {!isProcessing && (
              <button
                type="button"
                aria-label="Tutup widget"
                onClick={onClearCompleted}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Mode Expanded: Detail antrean dan progress melayang */
        <div className="pointer-events-auto ml-auto flex max-h-[82vh] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-2xl transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">
                  Proses Embedding AI
                </h3>
                <p className="text-xs font-semibold text-gray-500">
                  {isProcessing
                    ? `Memproses ${doneCount + 1} dari ${totalCount}`
                    : `${completedCount} dari ${totalCount} selesai`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Minimize ke pojok kanan bawah"
                onClick={() => onSetMinimized(true)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700"
              >
                <Minus size={18} />
              </button>
              {!isProcessing && (
                <button
                  type="button"
                  aria-label="Tutup antrean"
                  onClick={onClearCompleted}
                  className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="border-b border-gray-100 bg-surface px-5 py-3">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600">
              <span>Progres Total</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {currentProcessingItem && (
              <p className="mt-2 truncate text-xs font-medium text-gray-500">
                Sedang memproses:{" "}
                <span className="font-bold text-gray-700">
                  {currentProcessingItem.title}
                </span>
              </p>
            )}
          </div>

          {/* Scrollable File List */}
          <div className="max-h-64 flex-1 divide-y divide-gray-50 overflow-y-auto p-2">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-gray-50/60"
              >
                <FileText
                  size={18}
                  className="mt-0.5 shrink-0 text-gray-400"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-gray-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                    {item.file.name} • {formatBytes(item.size)}
                  </p>

                  {item.status === "error" && item.error && (
                    <p className="mt-1 text-xs font-medium text-error">
                      {item.error}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  {item.status === "queued" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                      <Clock size={11} />
                      Antrean
                    </span>
                  )}
                  {item.status === "processing" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Loader2 size={11} className="animate-spin" />
                      Memproses
                    </span>
                  )}
                  {item.status === "success" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                      <CheckCircle2 size={11} />
                      {item.chunks} bagian
                    </span>
                  )}
                  {item.status === "error" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold text-error">
                      <AlertCircle size={11} />
                      Gagal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
            <p className="text-[11px] font-medium text-gray-500">
              💡 Anda dapat berpindah ke menu admin lain secara bebas saat
              proses embedding berjalan.
            </p>
            <div className="mt-2.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onSetMinimized(true)}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200/60"
              >
                <ChevronDown size={14} />
                Minimize
              </button>
              {!isProcessing && (
                <button
                  type="button"
                  onClick={onClearCompleted}
                  className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark"
                >
                  Selesai
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}