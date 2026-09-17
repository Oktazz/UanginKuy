import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import { requireAdmin } from "@/lib/auth/authorization";
import { getCounterHistory } from "@/services/counter.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const month = searchParams.get("month") || undefined;

    const history = await getCounterHistory(limit, month);
    return successResponse(history, "Riwayat transaksi loket berhasil diambil");
  } catch (error) {
    return handleApiError(error);
  }
}
