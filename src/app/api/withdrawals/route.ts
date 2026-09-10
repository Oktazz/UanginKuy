import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import {
  createWithdrawal,
  getMyWithdrawals,
} from "@/services/withdrawal.service";
import { CreateWithdrawalSchema } from "@/validations/withdrawal.schema";
import { checkRateLimit, requestClientIp } from "@/utils/rate-limit";

export async function GET() {
  try {
    return successResponse(
      await getMyWithdrawals(),
      "Riwayat penarikan berhasil diambil.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(
      `withdrawals:create:${requestClientIp(request)}`,
      10,
    );
    if (!rateLimit.allowed) {
      return errorResponse("Too many requests", 429);
    }

    const payload = CreateWithdrawalSchema.parse(await request.json());
    return successResponse(
      await createWithdrawal(payload),
      "Penarikan berhasil diajukan.",
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
