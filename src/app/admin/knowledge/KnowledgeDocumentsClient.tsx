"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomAlertDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useKnowledgeUpload } from "@/components/admin/KnowledgeUploadProvider";
import { formatBytes } from "@/utils/format";
import { formatIndonesianDateTime } from "@/utils/date";
import {
  DocumentPreviewDialog,
  type PreviewDocument,
} from "./DocumentPreviewDialog";

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

const MAX_FILE_SIZE = 6 * 1024 * 1024;

export default function KnowledgeDocumentsClient({
  documents,
  canManage,
}: {
  documents: KnowledgeDocumentListItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { enqueueUploads } = useKnowledgeUpload();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [singleTitle, setSingleTitle] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [documentToDelete, setDocumentToDelete] =
    useState<KnowledgeDocumentListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewDocument | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const validateFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      return `Format file “${file.name}” tidak didukung (hanya PDF & DOCX).`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Ukuran file “${file.name}” melebihi 6 MB.`;
    }
    return null;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const newlyAdded = validFiles.filter((f) => !existingNames.has(f.name));
        return [...prev, ...newlyAdded];
      });
    }

    if (errors.length > 0) {
      setNotice({
        type: "error",
        message:
          errors.length === 1
            ? errors[0]
            : `${errors.length} file diabaikan karena format tidak didukung atau > 6 MB.`,
      });
    } else {
      setNotice(null);
    }

    // Reset input value agar dapat memilih file yang sama lagi jika diinginkan
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearAllSelected = () => {
    setSelectedFiles([]);
    setSingleTitle("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setNotice({
        type: "error",
        message: "Pilih minimal satu dokumen PDF atau DOCX.",
      });
      return;
    }

    const itemsToEnqueue = selectedFiles.map((file) => ({
      file,
      title:
        selectedFiles.length === 1 && singleTitle.trim()
          ? singleTitle.trim()
          : undefined,
    }));

    enqueueUploads(itemsToEnqueue);

    const count = selectedFiles.length;
    clearAllSelected();
    setNotice({
      type: "success",
      message: `${count} dokumen telah ditambahkan ke antrean embedding di pojok kanan bawah. Anda dapat berpindah halaman dengan bebas saat proses berlangsung.`,
    });
  };

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
                  <span className="font-medium text-gray-400">
                    {selectedFiles.length > 1
                      ? "(otomatis per file)"
                      : "(opsional)"}
                  </span>
                </label>
                <input
                  id="knowledge-title"
                  name="title"
                  maxLength={255}
                  value={singleTitle}
                  onChange={(e) => setSingleTitle(e.target.value)}
                  placeholder={
                    selectedFiles.length > 1
                      ? "Otomatis memakai nama masing-masing file"
                      : "Otomatis memakai nama file"
                  }
                  disabled={selectedFiles.length > 1}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="knowledge-file"
                  className="mb-2 block text-sm font-bold text-gray-700"
                >
                  Dokumen (Bisa pilih lebih dari satu)
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-primary transition-colors hover:bg-primary/10">
                  <UploadCloud size={20} aria-hidden="true" />
                  <span className="min-w-0 truncate font-bold">
                    {selectedFiles.length === 0
                      ? "Pilih satu atau beberapa file PDF/DOCX"
                      : `${selectedFiles.length} file dipilih (klik untuk tambah lagi)`}
                  </span>
                  <input
                    ref={inputRef}
                    id="knowledge-file"
                    name="file"
                    type="file"
                    multiple
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <Button
                type="submit"
                disabled={selectedFiles.length === 0}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 font-bold text-white shadow-sm hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UploadCloud size={19} />
                <span className="ml-2">
                  Upload & Embed
                  {selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ""}
                </span>
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-600">
                    File yang akan diproses ({selectedFiles.length}):
                  </span>
                  <button
                    type="button"
                    onClick={clearAllSelected}
                    className="text-xs font-bold text-error hover:underline"
                  >
                    Hapus Semua
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-xs"
                    >
                      <FileText size={14} className="text-primary" />
                      <span className="max-w-[200px] truncate font-bold text-gray-800">
                        {file.name}
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">
                        ({formatBytes(file.size)})
                      </span>
                      <button
                        type="button"
                        aria-label={`Hapus ${file.name}`}
                        onClick={() => removeSelectedFile(idx)}
                        className="ml-1 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-error"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                      {formatIndonesianDateTime(document.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Preview ${document.title}`}
                        disabled={previewingId === document.id}
                        onClick={() => handlePreview(document)}
                        loading={previewingId === document.id}
                        loadingLabel=""
                        className="rounded-xl text-gray-400 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Eye size={18} />
                      </Button>
                      {canManage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Hapus ${document.title}`}
                          disabled={deletingId === document.id}
                          onClick={() => setDocumentToDelete(document)}
                          loading={deletingId === document.id}
                          loadingLabel=""
                          className="rounded-xl text-gray-400 hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </Button>
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
        <DocumentPreviewDialog
          preview={preview}
          previewError={previewError}
          onClose={() => {
            setPreview(null);
            setPreviewError(null);
          }}
        />
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
