import { successResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import { getAuthenticatedProfile } from "@/lib/auth/authorization";
import {
  WITHDRAWAL_BANKS,
  WITHDRAWAL_FEE,
} from "@/lib/withdrawal-simulator";
import { ApiError } from "@/utils/error-handler";

export async function GET() {
  try {
    const { user, profile } = await getAuthenticatedProfile();
    if (!user) throw new ApiError("Sesi tidak valid.", 401);
    if (profile?.role !== "nasabah") {
      throw new ApiError("Hanya nasabah yang dapat melihat bank payout.", 403);
    }

    return successResponse({
      banks: WITHDRAWAL_BANKS,
      fee: WITHDRAWAL_FEE,
      environment: "simulator",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
