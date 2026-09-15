import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";
import { handleApiError, ApiError } from "@/utils/error-handler";
import { getAuthenticatedProfile } from "@/lib/auth/authorization";
import { requestCounterWithdrawal } from "@/services/counter.service";

export async function POST(req: NextRequest) {
  try {
    const { user, profile } = await getAuthenticatedProfile();
    if (!user || !profile) {
      throw new ApiError("Sesi tidak valid. Silakan masuk kembali.", 401);
    }
    if (profile.role !== "nasabah") {
      throw new ApiError("Hanya nasabah yang dapat membuat token tarik tunai", 403);
    }

    const body = await req.json();
    const amount = Number(body.amount);
    if (!amount || isNaN(amount) || amount < 10000) {
      throw new ApiError("Minimal penarikan adalah Rp 10.000", 400);
    }

    const result = await requestCounterWithdrawal(user.id, amount);
    return successResponse(result, "Token tarik tunai berhasil dibuat");
  } catch (error) {
    return handleApiError(error);
  }
}
