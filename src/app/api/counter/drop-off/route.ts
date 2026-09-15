import { NextRequest } from "next/server";
import { successResponse } from "@/utils/api-response";
import { handleApiError, ApiError } from "@/utils/error-handler";
import { requireAdmin } from "@/lib/auth/authorization";
import { processDropoffTransaction } from "@/services/counter.service";
import type { DropoffSubmissionPayload } from "@/types/counter";

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireAdmin();

    const body = (await req.json()) as DropoffSubmissionPayload;
    if (!body.clientId) {
      throw new ApiError("Nasabah belum dipilih", 400);
    }
    if (!body.paymentMethod || !["cash", "balance"].includes(body.paymentMethod)) {
      throw new ApiError("Metode pembayaran harus 'cash' atau 'balance'", 400);
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new ApiError("Daftar sampah tidak boleh kosong", 400);
    }

    const result = await processDropoffTransaction(user.id, body);
    return successResponse(result, "Transaksi drop-off berhasil diselesaikan");
  } catch (error) {
    return handleApiError(error);
  }
}
