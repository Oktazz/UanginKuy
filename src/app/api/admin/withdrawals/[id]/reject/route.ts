import { z } from "zod";
import { successResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import { rejectWithdrawal } from "@/services/withdrawal.service";
import { RejectWithdrawalSchema } from "@/validations/withdrawal.schema";
import { createClient } from "@/utils/supabase/server";
import { incrWindow } from "@/lib/redis";
import { NextRequest } from "next/server";

const IdSchema = z.string().uuid();

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
      return handleApiError(new Error("Invalid CSRF token"), 403);
    }

    // 2. Session-based authentication (cookie)
    const { cookies } = await import("next/headers");
    const supabase = await createClient(await cookies());
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return handleApiError(new Error("Unauthorized"), 401);
    }

    // 3. Rate limiting check
    const rateKey = `admin:withdrawal:reject:${user.id}`;
    const count = await incrWindow(rateKey, 60); // 1 minute window
    if (count > 20) {
      return handleApiError(new Error("Too many requests. Please try again later."), 429);
    }

    // 4. Parse rejection reason
    const { reason } = RejectWithdrawalSchema.parse(await request.json());

    return successResponse(
      await rejectWithdrawal(IdSchema.parse(id), reason),
      "Penarikan ditolak dan saldo dikembalikan.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}