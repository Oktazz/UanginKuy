import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";
import { handleApiError, ApiError } from "@/utils/error-handler";
import { requireAdmin } from "@/lib/auth/authorization";
import { searchNasabah, getTicketForCounter, getNasabahById } from "@/services/counter.service";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const ticketId = searchParams.get("ticket");
    const idParam = searchParams.get("id");

    if (idParam) {
      const nasabah = await getNasabahById(idParam);
      if (!nasabah) {
        throw new ApiError("Nasabah tidak ditemukan dengan ID tersebut", 404);
      }
      return successResponse(nasabah, "Data nasabah ditemukan");
    }

    if (ticketId) {
      const ticket = await getTicketForCounter(ticketId);
      if (!ticket) {
        throw new ApiError("Tiket tidak ditemukan", 404);
      }
      return successResponse(ticket, "Data tiket ditemukan");
    }

    if (!query) {
      return successResponse([], "Query kosong");
    }

    const results = await searchNasabah(query);
    return successResponse(results, "Pencarian nasabah berhasil");
  } catch (error) {
    return handleApiError(error);
  }
}
