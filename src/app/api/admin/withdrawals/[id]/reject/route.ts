import { z } from "zod";
import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import { rejectWithdrawal } from "@/services/withdrawal.service";
import { RejectWithdrawalSchema } from "@/validations/withdrawal.schema";

const IdSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { reason } = RejectWithdrawalSchema.parse(await request.json());
    return successResponse(
      await rejectWithdrawal(IdSchema.parse(id), reason),
      "Penarikan ditolak dan saldo dikembalikan.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
