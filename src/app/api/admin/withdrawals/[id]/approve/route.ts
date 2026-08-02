import { z } from "zod";
import { successResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import { approveWithdrawal } from "@/services/withdrawal.service";

const IdSchema = z.string().uuid();

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    return successResponse(
      await approveWithdrawal(IdSchema.parse(id)),
      "Penarikan simulasi berhasil disetujui.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
