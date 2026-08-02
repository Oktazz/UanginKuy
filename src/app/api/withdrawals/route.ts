import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import {
  createWithdrawal,
  getMyWithdrawals,
} from "@/services/withdrawal.service";
import { CreateWithdrawalSchema } from "@/validations/withdrawal.schema";

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
