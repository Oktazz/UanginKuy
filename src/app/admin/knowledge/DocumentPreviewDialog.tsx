"use client";

import { ExternalLink, X } from "lucide-react";

export type PreviewDocument = {
  title: string;
  originalName: string;
  mimeType: string;
  previewUrl: string;
  previewText: string;
};

interface DocumentPreviewDialogProps {
  preview: PreviewDocument | null;
  previewError: string | null;
  onClose: () => void;
}

export function DocumentPreviewDialog({
  preview,
  previewError,
  onClose,
}: DocumentPreviewDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="knowledge-preview-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <h2
              id="knowledge-preview-title"
              className="truncate text-lg font-extrabold text-gray-900"
            >
              {preview?.title ?? "Preview dokumen"}
            </h2>
            {preview && (
              <p className="mt-1 truncate text-sm font-medium text-gray-500">
                {preview.originalName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {preview?.previewUrl && (
              <a
                href={preview.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary"
              >
                <ExternalLink size={15} />
                <span>Buka di tab baru</span>
              </a>
            )}
            <button
              type="button"
              aria-label="Tutup preview"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        {previewError ? (
          <p className="p-8 text-sm font-semibold text-error">
            {previewError}
          </p>
        ) : preview?.mimeType === "application/pdf" ? (
          <iframe
            title={`Preview ${preview.title}`}
            src={preview.previewUrl}
            className="min-h-[70vh] w-full bg-gray-100"
          />
        ) : (
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap p-6 text-sm leading-7 text-gray-700">
            {preview?.previewText || "Teks preview tidak tersedia."}
          </pre>
        )}
      </div>
    </div>
  );
}