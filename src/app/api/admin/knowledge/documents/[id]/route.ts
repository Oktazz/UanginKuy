import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/utils/supabase/admin";

const DocumentIdSchema = z.string().uuid();
const STORAGE_PATH_PATTERN = /^documents\/[0-9a-f-]+\.(pdf|docx)$/i;
const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function storagePathFromMetadata(metadata: unknown): string | null {
  const metadataObject =
    typeof metadata === "string"
      ? (() => {
          try {
            return JSON.parse(metadata) as unknown;
          } catch {
            return null;
          }
        })()
      : metadata;
  if (
    !metadataObject ||
    typeof metadataObject !== "object" ||
    Array.isArray(metadataObject)
  ) {
    return null;
  }

  const path = (metadataObject as Record<string, unknown>).storage_path;
  return typeof path === "string" && STORAGE_PATH_PATTERN.test(path)
    ? path
    : null;
}

function metadataValue(metadata: unknown, key: string): string | null {
  const metadataObject =
    typeof metadata === "string"
      ? (() => {
          try {
            return JSON.parse(metadata) as unknown;
          } catch {
            return null;
          }
        })()
      : metadata;
  if (
    !metadataObject ||
    typeof metadataObject !== "object" ||
    Array.isArray(metadataObject)
  ) {
    return null;
  }
  const value = (metadataObject as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function documentMimeType(metadata: unknown, storagePath: string) {
  const storedMimeType = metadataValue(metadata, "mime_type");
  if (storedMimeType === "application/pdf" || storedMimeType === DOCX_MIME_TYPE) {
    return storedMimeType;
  }

  return storagePath.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : DOCX_MIME_TYPE;
}

function documentFilename(metadata: unknown, storagePath: string) {
  const fallback = storagePath.split("/").pop() ?? "dokumen";
  return (metadataValue(metadata, "original_name") ?? fallback)
    .replace(/[\\/\r\n\"]/g, "_")
    .slice(0, 255);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedId = DocumentIdSchema.safeParse((await params).id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "ID dokumen tidak valid." }, { status: 400 });
  }

  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data: document, error: readError } = await admin
      .from("knowledge_documents")
      .select("id, title, source_key, metadata")
      .eq("id", parsedId.data)
      .maybeSingle();

    if (readError) throw readError;
    if (!document) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
    }

    const storagePath =
      storagePathFromMetadata(document.metadata) ??
      (STORAGE_PATH_PATTERN.test(document.source_key) ? document.source_key : null);
    if (!storagePath) {
      return NextResponse.json({ error: "File asli dokumen tidak tersedia." }, { status: 404 });
    }

    if (request.nextUrl.searchParams.get("format") === "file") {
      const { data: file, error: downloadError } = await admin.storage
        .from("knowledge-documents")
        .download(storagePath);
      if (downloadError || !file) {
        throw downloadError ?? new Error("Preview file was not returned.");
      }

      return new NextResponse(file, {
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(documentFilename(document.metadata, storagePath))}`,
          "Content-Type": documentMimeType(document.metadata, storagePath),
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const { data: chunks, error: chunksError } = await admin
      .from("knowledge_chunks")
      .select("chunk_index, content")
      .eq("document_id", parsedId.data)
      .order("chunk_index", { ascending: true });
    if (chunksError) throw chunksError;

    const previewText = (chunks ?? [])
      .map((chunk) => (typeof chunk.content === "string" ? chunk.content : ""))
      .filter(Boolean)
      .join("\n\n---\n\n")
      .slice(0, 40_000);

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        source: document.source_key,
        originalName: documentFilename(document.metadata, storagePath),
        mimeType: documentMimeType(document.metadata, storagePath),
        previewUrl: `${new URL(request.url).pathname}?format=file`,
        previewText,
      },
    });
  } catch (error) {
    console.error("Knowledge document preview failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "Preview dokumen gagal dimuat." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedId = DocumentIdSchema.safeParse((await params).id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "ID dokumen tidak valid." }, { status: 400 });
  }

  try {
    await requireAdmin();
    const admin = createAdminClient();
    const { data: document, error: readError } = await admin
      .from("knowledge_documents")
      .select("id, source_key, metadata")
      .eq("id", parsedId.data)
      .maybeSingle();

    if (readError) throw readError;
    if (!document) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
    }

    const { error: deleteError } = await admin
      .from("knowledge_documents")
      .delete()
      .eq("id", parsedId.data);
    if (deleteError) throw deleteError;

    const storagePath =
      storagePathFromMetadata(document.metadata) ??
      (STORAGE_PATH_PATTERN.test(document.source_key) ? document.source_key : null);
    if (storagePath) {
      const { error: storageError } = await admin.storage
        .from("knowledge-documents")
        .remove([storagePath]);
      if (storageError) {
        console.error("Knowledge document storage cleanup failed", {
          reason: storageError.message,
        });
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Knowledge document deletion failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "Dokumen gagal dihapus." },
      { status: 500 },
    );
  }
}
