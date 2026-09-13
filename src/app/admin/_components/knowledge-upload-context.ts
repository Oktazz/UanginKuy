"use client";

import { createContext, useContext } from "react";

export interface UploadQueueItem {
  id: string;
  file: File;
  title: string;
  status: "queued" | "processing" | "success" | "error";
  chunks?: number;
  error?: string;
  size: number;
}

export interface KnowledgeUploadContextType {
  enqueueUploads: (items: Array<{ file: File; title?: string }>) => void;
  queue: UploadQueueItem[];
  isProcessing: boolean;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  clearCompleted: () => void;
  dismissItem: (id: string) => void;
}

export const KnowledgeUploadContext =
  createContext<KnowledgeUploadContextType | null>(null);

export const NOOP_UPLOAD_CONTEXT: KnowledgeUploadContextType = {
  enqueueUploads: () => {},
  queue: [],
  isProcessing: false,
  isMinimized: false,
  setIsMinimized: () => {},
  clearCompleted: () => {},
  dismissItem: () => {},
};

/**
 * Fallback no-op saat dipakai di luar provider (misal unit test).
 */
export function useKnowledgeUpload() {
  const context = useContext(KnowledgeUploadContext);
  return context ?? NOOP_UPLOAD_CONTEXT;
}