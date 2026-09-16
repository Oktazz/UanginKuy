import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";
import { handleApiError, ApiError } from "@/utils/error-handler";
import { requireAdmin } from "@/lib/auth/authorization";
import { getNasabahDetail } from "@/services/nasabah.service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;
    if (!id) {
      throw new ApiError("ID nasabah diperlukan", 400);
    }

    const detail = await getNasabahDetail(id);
    return successResponse(detail, "Detail nasabah berhasil diambil");
  } catch (error) {
    return handleApiError(error);
  }
}
