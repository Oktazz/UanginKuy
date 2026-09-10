import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/utils/api-response";
import { ApiError, handleApiError } from "@/utils/error-handler";
import { getAuthenticatedProfile } from "@/lib/auth/authorization";
import { validateSimulatedBankAccount } from "@/lib/withdrawal-simulator";
import { BankAccountSchema } from "@/validations/withdrawal.schema";
import { checkRateLimit } from "@/utils/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getAuthenticatedProfile();
    if (!user) throw new ApiError("Sesi tidak valid.", 401);
    if (profile?.role !== "nasabah") {
      throw new ApiError("Hanya nasabah yang dapat memvalidasi rekening.", 403);
    }

    const rateLimit = await checkRateLimit(`withdrawals:validate:${user.id}`, 20);
    if (!rateLimit.allowed) {
      return errorResponse("Too many requests", 429);
    }

    const payload = BankAccountSchema.parse(await request.json());
    return successResponse(
      validateSimulatedBankAccount(
        payload.bankCode,
        payload.accountNumber,
        profile.name,
      ),
      "Rekening berhasil divalidasi.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
