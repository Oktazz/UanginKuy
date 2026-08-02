import { successResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import { getAdminWithdrawals } from "@/services/withdrawal.service";

export async function GET() {
  try {
    return successResponse(
      await getAdminWithdrawals(),
      "Daftar penarikan berhasil diambil.",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
