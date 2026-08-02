import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/lib/auth/authorization";
import { ApiError } from "@/utils/error-handler";
import type { CreateWithdrawalPayload } from "@/validations/withdrawal.schema";
import {
  WITHDRAWAL_FEE,
  validateSimulatedBankAccount,
} from "@/lib/withdrawal-simulator";

export type WithdrawalRecord = {
  id: string;
  client_id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  bank_name: string;
  account_number: string;
  beneficiary_name: string | null;
  request_key: string;
  provider_reference_no: string | null;
  status: "pending" | "processing" | "success" | "failed";
  failure_reason: string | null;
  approved_at: string | null;
  completed_at: string | null;
  refunded_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function normalizeWithdrawal(data: unknown): WithdrawalRecord {
  return data as WithdrawalRecord;
}

async function getAuthenticatedCustomer() {
  const supabase = await createClient(await cookies());
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new ApiError("Sesi tidak valid.", 401);

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "nasabah") {
    throw new ApiError("Hanya nasabah yang dapat menarik saldo.", 403);
  }

  return { supabase, user, profile };
}

export async function createWithdrawal(payload: CreateWithdrawalPayload) {
  const { user, profile } = await getAuthenticatedCustomer();
  const bankAccount = validateSimulatedBankAccount(
    payload.bankCode,
    payload.accountNumber,
    profile.name,
  );

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("request_withdrawal", {
    p_client_id: user.id,
    p_amount: payload.amount,
    p_fee_amount: WITHDRAWAL_FEE,
    p_bank_name: payload.bankCode,
    p_account_number: bankAccount.accountNumber,
    p_beneficiary_name: bankAccount.accountName,
    p_request_key: payload.requestKey,
  });

  if (error) {
    if (error.message.includes("Insufficient balance")) {
      throw new ApiError("Saldo tidak mencukupi.", 409);
    }
    throw new ApiError(error.message, error.code === "22023" ? 400 : 500);
  }

  return normalizeWithdrawal(data);
}

export async function getMyWithdrawals() {
  const { supabase, user } = await getAuthenticatedCustomer();
  const { data, error } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Gagal mengambil riwayat penarikan: ${error.message}`);
  return (data ?? []).map(normalizeWithdrawal);
}

export async function getAdminWithdrawals() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("withdrawals")
    .select("*, profiles!client_id(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Gagal mengambil penarikan: ${error.message}`);
  return data ?? [];
}

async function finalizeWithdrawal(
  withdrawalId: string,
  status: "success" | "failed",
  reason: string | null,
) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("finalize_withdrawal", {
    p_withdrawal_id: withdrawalId,
    p_status: status,
    p_failure_reason: reason,
  });

  if (error) {
    if (error.message.includes("not pending")) {
      throw new ApiError("Penarikan ini sudah selesai diproses.", 409);
    }
    if (error.message.includes("not found")) {
      throw new ApiError("Penarikan tidak ditemukan.", 404);
    }
    throw new Error(`Gagal memproses penarikan: ${error.message}`);
  }

  return normalizeWithdrawal(data);
}

export function approveWithdrawal(withdrawalId: string) {
  return finalizeWithdrawal(withdrawalId, "success", null);
}

export function rejectWithdrawal(withdrawalId: string, reason?: string) {
  return finalizeWithdrawal(
    withdrawalId,
    "failed",
    reason?.trim() || "Ditolak oleh admin.",
  );
}
