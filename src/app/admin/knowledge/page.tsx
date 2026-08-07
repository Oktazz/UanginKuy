import { BookOpenCheck } from "lucide-react";

import { requireAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/utils/supabase/admin";
import KnowledgeDocumentsClient, {
  type KnowledgeDocumentListItem,
} from "./KnowledgeDocumentsClient";

type KnowledgeDocumentRow = {
  id: string;
  title: string;
  source_key: string;
  status: "draft" | "active" | "archived";
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

export default async function AdminKnowledgePage() {
  const { profile } = await requireAdmin();
  const canManage = profile?.role === "super_admin";
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("knowledge_documents")
    .select("id, title, source_key, status, metadata, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal memuat knowledge AI: ${error.message}`);
  }

  const documents = (data ?? []) as KnowledgeDocumentRow[];
  const documentIds = documents.map((document) => document.id);
  const { data: chunks, error: chunksError } = documentIds.length
    ? await admin
        .from("knowledge_chunks")
        .select("document_id")
        .in("document_id", documentIds)
    : { data: [], error: null };

  if (chunksError) {
    throw new Error(`Gagal memuat status embedding: ${chunksError.message}`);
  }

  const chunkCountByDocument = new Map<string, number>();
  for (const chunk of chunks ?? []) {
    const documentId = (chunk as { document_id: string }).document_id;
    chunkCountByDocument.set(
      documentId,
      (chunkCountByDocument.get(documentId) ?? 0) + 1,
    );
  }

  const listItems: KnowledgeDocumentListItem[] = documents.map((document) => {
    const metadata =
      document.metadata &&
      typeof document.metadata === "object" &&
      !Array.isArray(document.metadata)
        ? (document.metadata as Record<string, unknown>)
        : {};

    return {
      id: document.id,
      title: document.title,
      sourceKey: document.source_key,
      originalName:
        typeof metadata.original_name === "string"
          ? metadata.original_name
          : document.source_key,
      status: document.status,
      chunks: chunkCountByDocument.get(document.id) ?? 0,
      updatedAt: document.updated_at,
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpenCheck size={28} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Knowledge AI
          </h1>
          <p className="mt-2 max-w-3xl font-medium text-gray-500">
            {canManage
              ? "Unggah PDF atau Word untuk diekstrak dan di-embed otomatis oleh Gemini. Dokumen asli disimpan privat."
              : "Tinjau dokumen privat yang menjadi sumber pengetahuan UanginBot."}
          </p>
        </div>
      </header>

      <KnowledgeDocumentsClient documents={listItems} canManage={canManage} />
    </div>
  );
}
