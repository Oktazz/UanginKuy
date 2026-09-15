import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";
import { handleApiError, ApiError } from "@/utils/error-handler";
import { requireAdmin } from "@/lib/auth/authorization";
import {
  verifyCounterToken,
  executeCounterWithdrawal,
} from "@/services/counter.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      throw new ApiError("Parameter token wajib disertakan", 400);
    }

    const verification = await verifyCounterToken(token);
    return successResponse(verification, "Token penarikan valid");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAdmin();

    const body = await req.json();
    const tokenCode = body.tokenCode || body.token;
    if (!tokenCode) {
      throw new ApiError("Kode token wajib diisi", 400);
    }

    const result = await executeCounterWithdrawal(user.id, tokenCode);
    return successResponse(result, "Pencairan tunai di loket berhasil diselesaikan");
  } catch (error) {
    return handleApiError(error);
  }
}
