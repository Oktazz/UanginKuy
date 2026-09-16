import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";
import { handleApiError } from "@/utils/error-handler";
import { requireAdmin } from "@/lib/auth/authorization";
import {
  getNasabahList,
  getNasabahSummaryMetrics,
} from "@/services/nasabah.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const hasBalance = (searchParams.get("hasBalance") as "all" | "yes" | "no") || "all";
    const sort = (searchParams.get("sort") as "newest" | "balance_desc" | "balance_asc" | "name_asc") || "newest";
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    const [listResult, metrics] = await Promise.all([
      getNasabahList({ search, hasBalance, sort, page, limit }),
      getNasabahSummaryMetrics(),
    ]);

    return successResponse(
      {
        nasabah: listResult.nasabah,
        total: listResult.total,
        page,
        limit,
        metrics,
      },
      "Data nasabah berhasil diambil"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
