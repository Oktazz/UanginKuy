import { z } from "zod";
import { successResponse } from "@/utils/api-response";
import { handleApiError, ApiError } from "@/utils/error-handler";
import { approveWithdrawal } from "@/services/withdrawal.service";
import { createClient } from "@/utils/supabase/server";
import { incrWindow } from "@/lib/redis";
import { NextRequest } from "next/server";

const IdSchema = z.string().uuid("ID penarikan tidak valid");

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    // Convert Request to NextRequest for CSRF utility
    const nextRequest = new NextRequest(request.url, {
      headers: request.headers,
    });

    // 1. CSRF verification
    const csrfToken = nextRequest.headers.get("X-CSRF-Token") || "";
    const storedToken = nextRequest.cookies.get("next-csrf-token")?.value || "";
    const tokensMatch =
      storedToken.length === csrfToken.length &&
      storedToken.split("").every((char, i) => char === csrfToken[i]);
    if (!tokensMatch) {
      return handleApiError(
        new ApiError("Token keamanan (CSRF) tidak valid. Silakan muat ulang halaman.", 403),
      );
    }

    // 2. Session-based authentication (cookie)
    const { cookies } = await import("next/headers");
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return handleApiError(
        new ApiError("Sesi tidak valid. Silakan masuk kembali.", 401),
      );
    }

    // 3. Rate limiting check
    const rateKey = `admin:withdrawal:approve:${user.id}`;
    const count = await incrWindow(rateKey, 60); // 1 minute window
    if (count > 20) {
      return handleApiError(
        new ApiError("Terlalu banyak permintaan persetujuan penarikan. Silakan tunggu beberapa saat.", 429),
      );
    }

    return successResponse(
      await approveWithdrawal(IdSchema.parse(id)),
      "Penarikan simulasi berhasil disetujui.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}