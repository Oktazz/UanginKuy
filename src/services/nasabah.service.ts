import { createAdminClient } from "@/utils/supabase/admin";
import { ApiError } from "@/utils/error-handler";
import type {
  NasabahListItem,
  NasabahSummaryMetrics,
  NasabahDetailData,
  NasabahWasteDepositItem,
  NasabahWithdrawalItem,
  NasabahAddressItem,
} from "@/types/nasabah";

interface AddressRow {
  id: string;
  label?: string | null;
  recipient_name?: string | null;
  phone_number?: string | null;
  full_address?: string | null;
  city?: string | null;
  district?: string | null;
  is_primary?: boolean | null;
}

interface ProfileRow {
  id: string;
  name: string;
  account_number: string | null;
  balance: number | null;
  avatar_url: string | null;
  created_at: string;
  user_addresses?: AddressRow[] | null;
}

export interface GetNasabahListParams {
  search?: string;
  hasBalance?: "all" | "yes" | "no";
  sort?: "newest" | "balance_desc" | "balance_asc" | "name_asc";
  page?: number;
  limit?: number;
}

export async function getNasabahList(params: GetNasabahListParams = {}): Promise<{
  nasabah: NasabahListItem[];
  total: number;
}> {
  const admin = createAdminClient();
  const search = params.search?.trim();
  const hasBalance = params.hasBalance || "all";
  const sort = params.sort || "newest";
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 20));
  const offset = (page - 1) * limit;

  let query = admin
    .from("profiles")
    .select(
      `
      id,
      name,
      account_number,
      balance,
      avatar_url,
      created_at,
      user_addresses (id, label, recipient_name, phone_number, full_address, city, district, is_primary)
    `,
      { count: "exact" }
    )
    .eq("role", "nasabah");

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,account_number.ilike.%${search}%`
    );
  }

  if (hasBalance === "yes") {
    query = query.gt("balance", 0);
  } else if (hasBalance === "no") {
    query = query.lte("balance", 0);
  }

  if (sort === "balance_desc") {
    query = query.order("balance", { ascending: false });
  } else if (sort === "balance_asc") {
    query = query.order("balance", { ascending: true });
  } else if (sort === "name_asc") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("Error fetching nasabah list:", error);
    throw new ApiError("Gagal mengambil data nasabah", 500);
  }

  const profiles = (data as unknown as ProfileRow[]) || [];

  const nasabah: NasabahListItem[] = profiles.map((p) => {
    const addresses = p.user_addresses || [];
    const primaryAddr =
      addresses.find((a) => a.is_primary) || addresses[0] || null;

    return {
      id: p.id,
      name: p.name,
      account_number: p.account_number,
      balance: Number(p.balance || 0),
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      phone_number: primaryAddr?.phone_number || null,
      full_address: primaryAddr?.full_address || null,
      city: primaryAddr?.city || null,
      district: primaryAddr?.district || null,
    };
  });

  return {
    nasabah,
    total: count || nasabah.length,
  };
}

export async function getNasabahSummaryMetrics(): Promise<NasabahSummaryMetrics> {
  const admin = createAdminClient();

  const { data, count, error } = await admin
    .from("profiles")
    .select("balance", { count: "exact" })
    .eq("role", "nasabah");

  if (error || !data) {
    return {
      totalNasabah: 0,
      totalBalance: 0,
      activeNasabahCount: 0,
    };
  }

  const totalBalance = data.reduce(
    (sum, item) => sum + (Number(item.balance) || 0),
    0
  );
  const activeNasabahCount = data.filter((item) => Number(item.balance) > 0).length;

  return {
    totalNasabah: count || data.length,
    totalBalance,
    activeNasabahCount,
  };
}

export async function getNasabahDetail(
  nasabahId: string
): Promise<NasabahDetailData> {
  const admin = createAdminClient();

  // 1. Fetch profile
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("id, name, account_number, balance, avatar_url, created_at, role")
    .eq("id", nasabahId)
    .single();

  if (profErr || !profile) {
    throw new ApiError("Data nasabah tidak ditemukan", 404);
  }

  // 2. Fetch addresses
  const { data: addressesData } = await admin
    .from("user_addresses")
    .select("id, label, recipient_name, phone_number, full_address, district, city, is_primary")
    .eq("profile_id", nasabahId)
    .order("is_primary", { ascending: false });

  const addresses: NasabahAddressItem[] = ((addressesData as AddressRow[]) || []).map((a) => ({
    id: a.id,
    label: a.label || "Alamat",
    recipientName: a.recipient_name || null,
    phoneNumber: a.phone_number || null,
    fullAddress: a.full_address || "",
    district: a.district || null,
    city: a.city || null,
    isPrimary: Boolean(a.is_primary),
  }));

  // 3. Fetch waste deposit tickets with transaction details
  const { data: ticketsData } = await admin
    .from("tickets")
    .select(`
      id,
      short_id,
      service_type,
      status,
      payment_method,
      created_at,
      pickup_date,
      transaction_details (
        id,
        weight,
        price_applied,
        subtotal,
        waste_categories (name)
      )
    `)
    .eq("client_id", nasabahId)
    .order("created_at", { ascending: false });

  interface RawTd {
    id: number;
    weight: number;
    price_applied: number;
    subtotal: number;
    waste_categories: { name: string } | { name: string }[] | null;
  }

  interface RawTicket {
    id: string;
    short_id: string | null;
    service_type: "pickup" | "drop_off";
    status: string;
    payment_method: string | null;
    created_at: string;
    pickup_date: string | null;
    transaction_details: RawTd[] | null;
  }

  const wasteDeposits: NasabahWasteDepositItem[] = (
    (ticketsData as unknown as RawTicket[]) || []
  ).map((t) => {
    const details = t.transaction_details || [];
    const items = details.map((d) => {
      const cat = Array.isArray(d.waste_categories)
        ? d.waste_categories[0]
        : d.waste_categories;
      return {
        categoryName: cat?.name || "Sampah",
        weight: Number(d.weight) || 0,
        priceApplied: Number(d.price_applied) || 0,
        subtotal: Number(d.subtotal) || 0,
      };
    });

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: t.id,
      shortId: t.short_id,
      serviceType: t.service_type,
      status: t.status,
      paymentMethod: t.payment_method,
      createdAt: t.created_at,
      pickupDate: t.pickup_date,
      totalWeight,
      totalAmount,
      items,
    };
  });

  // 4. Fetch withdrawals
  const { data: withdrawalsData } = await admin
    .from("withdrawals")
    .select(`
      id,
      amount,
      fee_amount,
      net_amount,
      bank_name,
      account_number,
      withdrawal_type,
      token_code,
      status,
      failure_reason,
      created_at,
      completed_at,
      refunded_at
    `)
    .eq("client_id", nasabahId)
    .order("created_at", { ascending: false });

  interface RawWd {
    id: string;
    amount: number;
    fee_amount: number;
    net_amount: number;
    bank_name: string;
    account_number: string;
    withdrawal_type: "bank_transfer" | "cash_counter" | null;
    token_code: string | null;
    status: "pending" | "processing" | "success" | "failed";
    failure_reason: string | null;
    created_at: string;
    completed_at: string | null;
    refunded_at: string | null;
  }

  const withdrawals: NasabahWithdrawalItem[] = (
    (withdrawalsData as unknown as RawWd[]) || []
  ).map((w) => ({
    id: w.id,
    amount: Number(w.amount) || 0,
    feeAmount: Number(w.fee_amount) || 0,
    netAmount: Number(w.net_amount) || 0,
    bankName: w.bank_name,
    accountNumber: w.account_number,
    withdrawalType: w.withdrawal_type,
    tokenCode: w.token_code,
    status: w.status,
    failureReason: w.failure_reason,
    createdAt: w.created_at,
    completedAt: w.completed_at,
    refundedAt: w.refunded_at,
  }));

  // 5. Aggregate statistics
  const completedDeposits = wasteDeposits.filter(
    (d) => d.status === "completed"
  );
  const totalWasteWeight = completedDeposits.reduce(
    (sum, d) => sum + d.totalWeight,
    0
  );
  const totalWasteEarnings = completedDeposits.reduce(
    (sum, d) => sum + d.totalAmount,
    0
  );

  const successfulWithdrawals = withdrawals.filter(
    (w) => w.status === "success"
  );
  const totalWithdrawn = successfulWithdrawals.reduce(
    (sum, w) => sum + w.netAmount,
    0
  );

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      accountNumber: profile.account_number,
      balance: Number(profile.balance || 0),
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
    },
    statistics: {
      totalWasteWeight,
      totalWasteEarnings,
      totalWithdrawn,
      totalDepositsCount: wasteDeposits.length,
      totalWithdrawalsCount: withdrawals.length,
    },
    addresses,
    wasteDeposits,
    withdrawals,
  };
}
