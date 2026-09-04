"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomAlertDialog } from "@/components/ui/ConfirmDialog";

export type KnowledgeDocumentListItem = {
  id: string;
  title: string;
  sourceKey: string;
  originalName: string;
  status: "draft" | "active" | "archived";
  chunks: number;
  updatedAt: string;
};

type Notice = { type: "success" | "error"; message: string } | null;

type PreviewDocument = {
  title: string;
  originalName: string;
  mimeType: string;
  previewUrl: string;
  previewText: string;
};

const MAX_FILE_SIZE = 6 * 1024 * 1024;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function KnowledgeDocumentsClient({
  documents,
  canManage,
}: {
  documents: KnowledgeDocumentListItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewDocument | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const validateSelectedFile = (file: File | null) => {
    if (!file) return "Pilih dokumen PDF atau DOCX.";
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      return "Hanya format PDF dan DOCX yang didukung.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Ukuran dokumen maksimal 6 MB.";
    }
    return null;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const validationError = validateSelectedFile(file);
    setFileName(file?.name ?? "");
    setNotice(
      validationError ? { type: "error", message: validationError } : null,
    );
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = inputRef.current?.files?.[0] ?? null;
    const validationError = validateSelectedFile(file);
    if (validationError) {
      setNotice({ type: "error", message: validationError });
      return;
    }

    setIsUploading(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/knowledge/documents", {
        method: "POST",
        body: new FormData(form),
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
        throw new Error(payload.error ?? "Unggah dokumen gagal diproses.");
      }

      formRef.current?.reset();
      setFileName("");
      setNotice({
        type: "success",
        message: `“${payload.document.title}” berhasil di-embed menjadi ${payload.document.chunks} bagian knowledge.`,
      });
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unggah dokumen gagal.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const [documentToDelete, setDocumentToDelete] =
    useState<KnowledgeDocumentListItem | null>(null);

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    setDeletingId(documentToDelete.id);
    setNotice(null);
    try {
      const response = await fetch(
        `/api/admin/knowledge/documents/${documentToDelete.id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Dokumen gagal dihapus.");
      }
      setNotice({
        type: "success",
        message: "Dokumen dan embedding berhasil dihapus.",
      });
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof Error ? error.message : "Dokumen gagal dihapus.",
      });
    } finally {
      setDeletingId(null);
      setDocumentToDelete(null);
    }
  };

  const handlePreview = async (document: KnowledgeDocumentListItem) => {
    setPreviewingId(document.id);
    setPreview(null);
    setPreviewError(null);
    try {
      const response = await fetch(
        `/api/admin/knowledge/documents/${document.id}`,
      );
      const payload = (await response.json()) as {
        error?: string;
        document?: PreviewDocument;
      };
      if (!response.ok || !payload.document) {
        throw new Error(payload.error ?? "Preview dokumen gagal dimuat.");
      }
      setPreview(payload.document);
    } catch (error) {
      setPreviewError(
        error instanceof Error
          ? error.message
          : "Preview dokumen gagal dimuat.",
      );
    } finally {
      setPreviewingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {canManage ? (
        <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm lg:p-8">
          <form ref={formRef} onSubmit={handleUpload} className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] lg:items-end">
              <div>
                <label
                  htmlFor="knowledge-title"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  Judul knowledge{" "}
                  <span className="font-medium text-gray-400">(opsional)</span>
                </label>
                <input
                  id="knowledge-title"
                  name="title"
                  maxLength={255}
                  placeholder="Otomatis memakai nama file"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="knowledge-file"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  Dokumen
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-primary transition-colors hover:bg-primary/10">
                  <UploadCloud size={20} aria-hidden="true" />
                  <span className="min-w-0 truncate font-bold">
                    {fileName || "Pilih file PDF atau DOCX"}
                  </span>
                  <input
                    ref={inputRef}
                    id="knowledge-file"
                    name="file"
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" size={19} />
                ) : (
                  <UploadCloud size={19} />
                )}
                <span className="ml-2">
                  {isUploading ? "Memproses..." : "Upload & Embed"}
                </span>
              </button>
            </div>
            <p className="text-sm font-medium text-gray-500">
              Maksimal 6 MB. PDF hasil scan tanpa teks belum didukung; gunakan
              PDF berbasis teks atau DOCX.
            </p>
          </form>

          {notice && (
            <div
              role={notice.type === "error" ? "alert" : "status"}
              className={`mt-5 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
                notice.type === "success"
                  ? "bg-success/10 text-success"
                  : "bg-error/10 text-error"
              }`}
            >
              {notice.type === "success" && (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-3xl border border-primary/15 bg-primary/5 px-6 py-5 text-sm font-semibold text-primary-dark">
          Anda memiliki akses baca-saja. Upload dan penghapusan dokumen hanya
          dapat dilakukan oleh super admin.
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 lg:px-8">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Dokumen terindeks
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              {canManage
                ? "Preview atau hapus dokumen yang tidak lagi boleh menjadi referensi UanginBot."
                : "Preview dokumen yang menjadi referensi UanginBot."}
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-extrabold text-gray-600">
            {documents.length} dokumen
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText
              size={40}
              className="mx-auto text-gray-300"
              aria-hidden="true"
            />
            <p className="mt-4 font-bold text-gray-700">
              Belum ada knowledge dari dokumen
            </p>
            <p className="mt-1 text-sm font-medium text-gray-500">
              {canManage
                ? "Unggah panduan, SOP, atau FAQ pertama Anda."
                : "Belum ada dokumen yang dapat ditinjau."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-gray-50/70 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-extrabold lg:px-8">Dokumen</th>
                  <th className="px-6 py-4 font-extrabold">Embedding</th>
                  <th className="px-6 py-4 font-extrabold">Status</th>
                  <th className="px-6 py-4 font-extrabold">Diperbarui</th>
                  <th className="px-6 py-4 text-right font-extrabold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 lg:px-8">
                      <p className="font-bold text-gray-900">
                        {document.title}
                      </p>
                      <p className="mt-0.5 max-w-xs truncate text-sm font-medium text-gray-500">
                        {document.originalName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-700">
                      {document.chunks} bagian
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-extrabold text-success">
                        {document.status === "active"
                          ? "Aktif"
                          : document.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500">
                      {formatDate(document.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        aria-label={`Preview ${document.title}`}
                        disabled={previewingId === document.id}
                        onClick={() => handlePreview(document)}
                        className="inline-flex items-center rounded-xl p-2.5 text-gray-400 transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {previewingId === document.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          aria-label={`Hapus ${document.title}`}
                          disabled={deletingId === document.id}
                          onClick={() => setDocumentToDelete(document)}
                          className="inline-flex items-center rounded-xl p-2.5 text-gray-400 transition-colors hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === document.id ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(preview || previewError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="knowledge-preview-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreview(null);
              setPreviewError(null);
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
              <button
                type="button"
                aria-label="Tutup preview"
                onClick={() => {
                  setPreview(null);
                  setPreviewError(null);
                }}
                className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
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
      )}

      <CustomAlertDialog
        open={Boolean(documentToDelete)}
        title="Hapus Dokumen Knowledge"
        description={`Apakah Anda yakin ingin menghapus “${documentToDelete?.title ?? ""}” dari knowledge AI? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        isLoading={Boolean(deletingId)}
        onConfirm={confirmDelete}
        onCancel={() => setDocumentToDelete(null)}
      />
    </div>
  );
}
