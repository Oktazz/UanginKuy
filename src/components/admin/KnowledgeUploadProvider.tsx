"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadQueueWidget } from "./UploadQueueWidget";
import {
  KnowledgeUploadContext,
  useKnowledgeUpload,
  type KnowledgeUploadContextType,
  type UploadQueueItem,
} from "./knowledge-upload-context";

export { useKnowledgeUpload };
export type { UploadQueueItem, KnowledgeUploadContextType } from "./knowledge-upload-context";

export function KnowledgeUploadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isWorkerRunningRef = useRef(false);

  const enqueueUploads = useCallback(
    (items: Array<{ file: File; title?: string }>) => {
      if (!items || items.length === 0) return;

      const newItems: UploadQueueItem[] = items.map((item) => {
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        const baseTitle = item.title?.trim();
        const fallbackTitle = item.file.name.replace(/\.[^/.]+$/, "");
        return {
          id,
          file: item.file,
          title: baseTitle || fallbackTitle,
          status: "queued",
          size: item.file.size,
        };
      });

      setQueue((prev) => [...prev, ...newItems]);
      setIsMinimized(false);
    },
    [],
  );

  const clearCompleted = useCallback(() => {
    setQueue((prev) =>
      prev.filter(
        (item) => item.status === "queued" || item.status === "processing",
      ),
    );
  }, []);

  const dismissItem = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Worker loop: memproses antrean sekuensial satu per satu
  useEffect(() => {
    if (isWorkerRunningRef.current) return;

    const nextItem = queue.find((item) => item.status === "queued");
    if (!nextItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronisasi status saat antrean habis
      if (isProcessing) setIsProcessing(false);
      return;
    }

    isWorkerRunningRef.current = true;
    setIsProcessing(true);

    const processItem = async (item: UploadQueueItem) => {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "processing" } : q,
        ),
      );

      try {
        const formData = new FormData();
        formData.append("file", item.file);
        if (item.title) {
          formData.append("title", item.title);
        }

        const response = await fetch("/api/admin/knowledge/documents", {
          method: "POST",
          body: formData,
        });

        let payload: {
          error?: string;
          document?: { chunks: number; title: string };
        };

        try {
          payload = (await response.json()) as {
            error?: string;
            document?: { chunks: number; title: string };
          };
        } catch {
          const text = await response.text().catch(() => "");
          throw new Error(
            text ||
              `Server mengembalikan respons tidak valid (Status ${response.status}).`,
          );
        }

        if (!response.ok || !payload.document) {
          throw new Error(payload.error ?? "Embedding dokumen gagal diproses.");
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "success",
                  chunks: payload.document?.chunks ?? 1,
                }
              : q,
          ),
        );

        // Refresh rute agar data tabel terupdate otomatis
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Gagal mengunggah dokumen.";
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "error", error: message } : q,
          ),
        );
      } finally {
        isWorkerRunningRef.current = false;
        // Memicu siklus berikutnya
        setQueue((prev) => [...prev]);
      }
    };

    void processItem(nextItem);
  }, [queue, isProcessing, router]);

  // Warning jika tab ingin ditutup saat sedang proses
  useEffect(() => {
    if (!isProcessing) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isProcessing]);

  const contextValue = useMemo<KnowledgeUploadContextType>(
    () => ({
      enqueueUploads,
      queue,
      isProcessing,
      isMinimized,
      setIsMinimized,
      clearCompleted,
      dismissItem,
    }),
    [
      enqueueUploads,
      queue,
      isProcessing,
      isMinimized,
      clearCompleted,
      dismissItem,
    ],
  );

  return (
    <KnowledgeUploadContext.Provider value={contextValue}>
      {children}

      {/* Floating Widget: Hanya muncul jika ada antrean */}
      {queue.length > 0 && (
        <UploadQueueWidget
          queue={queue}
          isProcessing={isProcessing}
          isMinimized={isMinimized}
          onSetMinimized={setIsMinimized}
          onClearCompleted={clearCompleted}
        />
      )}
    </KnowledgeUploadContext.Provider>
  );
}