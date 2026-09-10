import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedProfile } from "@/lib/auth/authorization";
import {
  buildKnowledgeDocumentIdentity,
  extractKnowledgeDocumentText,
  validateKnowledgeUpload,
} from "@/services/knowledge-document.service";
import { ingestKnowledgeDocument } from "@/services/rag.service";
import { createAdminClient } from "@/utils/supabase/admin";
import { checkRateLimit } from "@/utils/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_TITLE_LENGTH = 255;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getAuthenticatedProfile();
    if (!user) {
      return errorResponse("Sesi tidak valid. Silakan masuk kembali.", 401);
    }
    if (profile?.role !== "super_admin") {
      return errorResponse(
        "Pengelolaan Knowledge AI hanya dapat dilakukan oleh super admin.",
        403,
      );
    }

    // Embedding berat + mahal — batasi intensitas per admin
    const rateLimit = await checkRateLimit(`knowledge:upload:${user.id}`, 10);
    if (!rateLimit.allowed) {
      return errorResponse("Terlalu banyak unggahan. Silakan coba lagi nanti.", 429);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const titleField = formData.get("title");

    if (!(file instanceof File) || file.size === 0) {
      return errorResponse("Pilih dokumen PDF atau DOCX terlebih dahulu.", 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const upload = validateKnowledgeUpload({
      name: file.name,
      type: file.type,
      size: file.size,
      signature: bytes.subarray(0, 8),
    });

    if (!upload) {
      return errorResponse(
        "Dokumen harus berupa PDF atau DOCX yang valid dengan ukuran maksimal 6 MB.",
        400,
      );
    }

    const extractedText = await extractKnowledgeDocumentText(
      bytes,
      upload.extension,
    );
    if (!extractedText) {
      return errorResponse(
        "Teks tidak dapat dibaca. Pastikan dokumen tidak kosong, bukan hasil scan, dan tidak melebihi 100.000 karakter.",
        422,
      );
    }

    const requestedTitle =
      typeof titleField === "string" ? titleField.trim() : "";
    if (requestedTitle.length > MAX_TITLE_LENGTH) {
      return errorResponse("Judul dokumen maksimal 255 karakter.", 400);
    }

    const identity = buildKnowledgeDocumentIdentity(
      file.name,
      upload.extension,
    );
    const title = requestedTitle || identity.title;
    const admin = createAdminClient();
    const { error: storageError } = await admin.storage
      .from("knowledge-documents")
      // Passing the original File makes storage-js use its standard multipart
      // upload path. Sending a raw Uint8Array can return success while leaving
      // a zero-byte object in Storage in this server runtime.
      .upload(identity.storagePath, file, {
        contentType: upload.mimeType,
        upsert: false,
        cacheControl: "0",
      });

    if (storageError) {
      console.error("Knowledge document storage upload failed", {
        reason: storageError.message,
      });
      return errorResponse("Dokumen gagal disimpan. Coba lagi.", 502);
    }

    const { data: storedFile, error: infoError } = await admin.storage
      .from("knowledge-documents")
      .info(identity.storagePath);
    if (infoError || !storedFile || storedFile.size !== file.size) {
      console.error("Knowledge document storage verification failed", {
        expectedSize: file.size,
        actualSize: storedFile?.size ?? null,
        reason: infoError?.message ?? "stored file size mismatch",
      });
      await admin.storage
        .from("knowledge-documents")
        .remove([identity.storagePath]);
      return errorResponse(
        "Dokumen gagal diverifikasi setelah disimpan. Coba lagi.",
        502,
      );
    }

    const ingestion = await ingestKnowledgeDocument({
      title,
      sourceKey: identity.sourceKey,
      documentText: extractedText,
      metadata: {
        original_name: file.name.slice(0, 255),
        mime_type: upload.mimeType,
        storage_path: identity.storagePath,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
      },
      sessionId: `admin-upload-${user.id}`,
    });

    if (!ingestion) {
      await admin.storage
        .from("knowledge-documents")
        .remove([identity.storagePath]);
      return errorResponse(
        "Embedding belum dapat diproses. Periksa kredensial Gemini dan koneksi database lalu coba lagi.",
        502,
      );
    }

    return NextResponse.json(
      {
        document: {
          id: ingestion.documentId,
          title,
          source: ingestion.source,
          chunks: ingestion.chunks,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Knowledge document upload failed", {
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return errorResponse("Unggah dokumen gagal diproses.", 500);
  }
}
