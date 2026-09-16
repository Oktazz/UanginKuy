import { createAdminClient } from "@/utils/supabase/admin";
import { customAlphabet } from "nanoid";
import type {
  NasabahSearchRecord,
  DropoffSubmissionPayload,
  DropoffTransactionResult,
  CounterWithdrawalVerification,
  CounterHistoryItem,
  ActiveCounterToken,
} from "@/types/counter";
import { ApiError } from "@/utils/error-handler";

const generateShortId = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

interface AddressRow {
  phone_number?: string | null;
  full_address?: string | null;
  city?: string | null;
  district?: string | null;
  is_primary?: boolean | null;
}

interface SearchProfileRow {
  id: string;
  name: string;
  account_number: string | null;
  balance: number | null;
  avatar_url: string | null;
  created_at?: string | null;
  user_addresses?: AddressRow[] | null;
}

export async function searchNasabah(query: string): Promise<NasabahSearchRecord[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const admin = createAdminClient();

  // Search by Member ID (account_number), name, or phone number via user_addresses
  const { data: profiles, error } = await admin
    .from("profiles")
    .select(`
      id,
      name,
      account_number,
      balance,
      avatar_url,
      created_at,
      user_addresses (phone_number, full_address, city, district, is_primary)
    `)
    .eq("role", "nasabah")
    .or(`account_number.ilike.%${cleanQuery}%,name.ilike.%${cleanQuery}%`)
    .limit(10);

  if (error) {
    console.error("Error searching nasabah:", error);
    throw new ApiError("Gagal mencari data nasabah", 500);
  }

  // Also search by phone number if query looks like digits
  let additionalProfiles: SearchProfileRow[] = [];
  if (/^[0-9+]+$/.test(cleanQuery)) {
    const { data: addrProfiles } = await admin
      .from("user_addresses")
      .select(`
        profile_id,
        phone_number,
        full_address,
        city,
        district,
        profiles!inner (id, name, account_number, balance, avatar_url, role, created_at)
      `)
      .ilike("phone_number", `%${cleanQuery}%`)
      .eq("profiles.role", "nasabah")
      .limit(5);

    if (addrProfiles && addrProfiles.length > 0) {
      additionalProfiles = (addrProfiles as unknown as {
        profile_id: string;
        phone_number: string;
        full_address: string;
        city: string;
        district: string;
        profiles: SearchProfileRow;
      }[]).map((item) => ({
        ...item.profiles,
        user_addresses: [{
          phone_number: item.phone_number,
          full_address: item.full_address,
          city: item.city,
          district: item.district,
          is_primary: true,
        }],
      }));
    }
  }

  const combined = [...((profiles as unknown as SearchProfileRow[]) || []), ...additionalProfiles];
  const uniqueMap = new Map<string, NasabahSearchRecord>();

  for (const p of combined) {
    if (!uniqueMap.has(p.id)) {
      const addrList = Array.isArray(p.user_addresses) ? p.user_addresses : [];
      const primaryAddr = addrList.find((a) => a.is_primary) || addrList[0];

      uniqueMap.set(p.id, {
        id: p.id,
        name: p.name,
        account_number: p.account_number,
        phone_number: primaryAddr?.phone_number || null,
        balance: Number(p.balance || 0),
        avatar_url: p.avatar_url,
        address: primaryAddr?.full_address || null,
        city: primaryAddr?.city || primaryAddr?.district || null,
        joined_at: p.created_at || null,
      });
    }
  }

  return Array.from(uniqueMap.values());
}

export async function getNasabahById(idOrAccount: string): Promise<NasabahSearchRecord | null> {
  const clean = idOrAccount.trim();
  if (!clean) return null;

  const admin = createAdminClient();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

  let query = admin
    .from("profiles")
    .select(`
      id,
      name,
      account_number,
      balance,
      avatar_url,
      created_at,
      user_addresses (phone_number, full_address, city, district, is_primary)
    `)
    .eq("role", "nasabah");

  if (isUUID) {
    query = query.eq("id", clean);
  } else {
    query = query.eq("account_number", clean.toUpperCase());
  }

  const { data: profile, error } = await query.maybeSingle();

  if (error || !profile) return null;

  interface SingleProfileRow {
    id: string;
    name: string;
    account_number: string | null;
    balance: number | null;
    avatar_url: string | null;
    created_at?: string | null;
    user_addresses?: AddressRow[] | null;
  }

  const typedProfile = profile as unknown as SingleProfileRow;
  const addrList = Array.isArray(typedProfile.user_addresses) ? typedProfile.user_addresses : [];
  const primaryAddr = addrList.find((a) => a.is_primary) || addrList[0];

  return {
    id: typedProfile.id,
    name: typedProfile.name,
    account_number: typedProfile.account_number,
    phone_number: primaryAddr?.phone_number || null,
    balance: Number(typedProfile.balance || 0),
    avatar_url: typedProfile.avatar_url,
    address: primaryAddr?.full_address || null,
    city: primaryAddr?.city || primaryAddr?.district || null,
    joined_at: typedProfile.created_at || null,
  };
}

export async function getTicketForCounter(ticketIdOrShortId: string) {
  const clean = ticketIdOrShortId.trim();
  if (!clean) return null;

  const admin = createAdminClient();
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

  let query = admin
    .from("tickets")
    .select(`
      *,
      client:profiles!client_id(id, name, account_number, balance, avatar_url),
      user_addresses!address_id(recipient_name, phone_number, full_address)
    `);

  if (isUUID) {
    query = query.eq("id", clean);
  } else {
    query = query.eq("short_id", clean.toUpperCase());
  }

  const { data: ticket, error } = await query.maybeSingle();
  if (error || !ticket) return null;

  return ticket;
}

export async function processDropoffTransaction(
  adminId: string,
  payload: DropoffSubmissionPayload
): Promise<DropoffTransactionResult> {
  const admin = createAdminClient();

  if (!payload.clientId) {
    throw new ApiError("Nasabah harus dipilih", 400);
  }
  if (!payload.items || payload.items.length === 0) {
    throw new ApiError("Minimal harus ada 1 jenis sampah yang ditimbang", 400);
  }

  // Verify client exists
  const { data: clientProfile, error: clientErr } = await admin
    .from("profiles")
    .select("id, name, balance")
    .eq("id", payload.clientId)
    .single();

  if (clientErr || !clientProfile) {
    throw new ApiError("Akun nasabah tidak ditemukan", 404);
  }

  // Fetch carbon factors for categories
  const categoryIds = payload.items.map((i) => i.wasteCategoryId);
  const { data: categories } = await admin
    .from("waste_categories")
    .select("id, carbon_factor, price_per_kg")
    .in("id", categoryIds);

  const categoryMap = new Map<number, { carbonFactor: number; price: number }>();
  (categories || []).forEach((c) => {
    categoryMap.set(c.id, {
      carbonFactor: Number(c.carbon_factor) || 2.5,
      price: Number(c.price_per_kg),
    });
  });

  const totalAmount = payload.items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalWeight = payload.items.reduce((sum, item) => sum + item.weight, 0);
  const totalCarbon = payload.items.reduce((sum, item) => {
    const cat = categoryMap.get(item.wasteCategoryId);
    const factor = cat?.carbonFactor || 2.5;
    return sum + item.weight * factor;
  }, 0);

  const now = new Date().toISOString();
  const todayDate = now.split("T")[0];

  let ticketId = payload.ticketId;
  let ticketShortId: string | null = null;

  if (ticketId) {
    // Update existing ticket
    const { data: existingTicket, error: tErr } = await admin
      .from("tickets")
      .select("id, short_id, status")
      .eq("id", ticketId)
      .single();

    if (tErr || !existingTicket) {
      throw new ApiError("Tiket drop-off tidak ditemukan", 404);
    }
    if (existingTicket.status === "completed") {
      throw new ApiError("Tiket ini sudah diselesaikan sebelumnya", 400);
    }

    ticketShortId = existingTicket.short_id;

    // Update ticket fields
    const { error: updErr } = await admin
      .from("tickets")
      .update({
        status: "completed",
        service_type: "drop_off",
        payment_method: payload.paymentMethod,
        served_by_admin_id: adminId,
        updated_at: now,
      })
      .eq("id", ticketId);

    if (updErr) {
      throw new ApiError(`Gagal memperbarui tiket: ${updErr.message}`, 500);
    }
  } else {
    // Create new drop-off ticket for walk-in
    ticketShortId = generateShortId();
    const { data: newTicket, error: insErr } = await admin
      .from("tickets")
      .insert({
        client_id: payload.clientId,
        service_type: "drop_off",
        payment_method: payload.paymentMethod,
        pickup_date: todayDate,
        short_id: ticketShortId,
        status: "completed",
        served_by_admin_id: adminId,
        created_at: now,
        updated_at: now,
      })
      .select("id, short_id")
      .single();

    if (insErr || !newTicket) {
      throw new ApiError(`Gagal membuat transaksi drop-off: ${insErr?.message}`, 500);
    }

    ticketId = newTicket.id;
  }

  // Insert transaction_details
  const transactionDetailsData = payload.items.map((item) => ({
    ticket_id: ticketId!,
    waste_category_id: item.wasteCategoryId,
    weight: item.weight,
    subtotal: item.subtotal,
    price_applied: item.priceApplied,
    created_at: now,
  }));

  const { error: tdErr } = await admin.from("transaction_details").insert(transactionDetailsData);
  if (tdErr) {
    throw new ApiError(`Gagal menyimpan rincian sampah: ${tdErr.message}`, 500);
  }

  // If payment method is 'balance', ensure balance is updated
  // (In case migration trigger is not yet applied in local db, we guarantee atomicity)
  if (payload.paymentMethod === "balance") {
    // Check if trigger updated balance
    const { data: updatedProfile } = await admin
      .from("profiles")
      .select("balance")
      .eq("id", payload.clientId)
      .single();

    const expectedMinBalance = Number(clientProfile.balance || 0) + totalAmount;
    if (Number(updatedProfile?.balance || 0) < expectedMinBalance) {
      await admin
        .from("profiles")
        .update({
          balance: expectedMinBalance,
          updated_at: now,
        })
        .eq("id", payload.clientId);
    }
  }

  // Log audit
  await admin.from("audit_logs").insert({
    actor_id: adminId,
    action: "counter.dropoff_completed",
    target_type: "ticket",
    target_id: ticketId,
    details: {
      client_id: payload.clientId,
      payment_method: payload.paymentMethod,
      total_amount: totalAmount,
      total_weight: totalWeight,
      carbon_saved: totalCarbon,
    },
  });

  return {
    ticketId: ticketId!,
    ticketShortId,
    clientId: payload.clientId,
    clientName: clientProfile.name,
    paymentMethod: payload.paymentMethod,
    totalWeight,
    totalAmount,
    carbonSaved: totalCarbon,
    completedAt: now,
  };
}

export async function refundExpiredCounterTokens(clientId?: string): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  try {
    let query = admin
      .from("withdrawals")
      .select("id, client_id, amount, token_expires_at")
      .eq("withdrawal_type", "cash_counter")
      .eq("status", "pending")
      .lt("token_expires_at", now);

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data: expiredList, error } = await query;
    if (error || !expiredList || !Array.isArray(expiredList) || expiredList.length === 0) {
      return 0;
    }

    let refundedCount = 0;
    for (const item of expiredList) {
      const { data: prof } = await admin
        .from("profiles")
        .select("balance")
        .eq("id", item.client_id)
        .single();

      if (prof) {
        const newBal = Number(prof.balance || 0) + Number(item.amount);
        await admin
          .from("profiles")
          .update({ balance: newBal, updated_at: now })
          .eq("id", item.client_id);

        await admin
          .from("withdrawals")
          .update({
            status: "failed",
            failure_reason: "Token telah kadaluarsa (30 menit)",
            refunded_at: now,
            completed_at: now,
            updated_at: now,
          })
          .eq("id", item.id);

        refundedCount++;
      }
    }

    return refundedCount;
  } catch (e) {
    console.error("Error refunding expired counter tokens:", e);
    return 0;
  }
}

export async function getActiveCounterToken(clientId: string): Promise<ActiveCounterToken | null> {
  try {
    await refundExpiredCounterTokens(clientId);
  } catch {
    // Ignore cleanup errors
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  try {
    const { data, error } = await admin
      .from("withdrawals")
      .select("id, token_code, token_expires_at, amount")
      .eq("client_id", clientId)
      .eq("withdrawal_type", "cash_counter")
      .eq("status", "pending")
      .gt("token_expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.token_code || !data.token_expires_at) {
      return null;
    }

    return {
      withdrawalId: data.id,
      tokenCode: data.token_code,
      expiresAt: data.token_expires_at,
      amount: Number(data.amount),
    };
  } catch {
    return null;
  }
}

export async function cancelCounterWithdrawal(
  clientId: string,
  withdrawalId?: string
): Promise<{ refundedAmount: number; newBalance: number }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  let query = admin
    .from("withdrawals")
    .select("id, client_id, amount, status, withdrawal_type")
    .eq("client_id", clientId)
    .eq("withdrawal_type", "cash_counter")
    .eq("status", "pending");

  if (withdrawalId) {
    query = query.eq("id", withdrawalId);
  } else {
    query = query.order("created_at", { ascending: false }).limit(1);
  }

  const { data: withdrawal, error } = await query.maybeSingle();

  if (error || !withdrawal) {
    throw new ApiError("Permintaan penarikan tunai tidak ditemukan atau sudah tidak aktif.", 404);
  }

  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("balance")
    .eq("id", clientId)
    .single();

  if (profErr || !profile) {
    throw new ApiError("Akun nasabah tidak ditemukan.", 404);
  }

  const newBalance = Number(profile.balance || 0) + Number(withdrawal.amount);

  const { error: balErr } = await admin
    .from("profiles")
    .update({ balance: newBalance, updated_at: now })
    .eq("id", clientId);

  if (balErr) {
    throw new ApiError("Gagal mengembalikan saldo akun.", 500);
  }

  await admin
    .from("withdrawals")
    .update({
      status: "failed",
      failure_reason: "Dibatalkan oleh nasabah",
      refunded_at: now,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", withdrawal.id);

  return {
    refundedAmount: Number(withdrawal.amount),
    newBalance,
  };
}

export async function requestCounterWithdrawal(
  clientId: string,
  amount: number
): Promise<{ tokenCode: string; expiresAt: string; amount: number; withdrawalId: string }> {
  if (amount < 10000) {
    throw new ApiError("Minimal penarikan adalah Rp 10.000", 400);
  }

  const admin = createAdminClient();

  // Check client balance
  const { data: profile, error: profErr } = await admin
    .from("profiles")
    .select("id, name, balance")
    .eq("id", clientId)
    .single();

  if (profErr || !profile) {
    throw new ApiError("Akun nasabah tidak ditemukan", 404);
  }

  if (Number(profile.balance || 0) < amount) {
    throw new ApiError("Saldo Anda tidak mencukupi untuk nominal penarikan ini", 400);
  }

  // Auto-refund expired tokens if any
  try {
    await refundExpiredCounterTokens(clientId);
  } catch {
    // Ignore cleanup error
  }

  // Check if client already has an active token
  const activeExisting = await getActiveCounterToken(clientId);
  if (activeExisting) {
    throw new ApiError(
      "Anda masih memiliki token penarikan aktif yang belum selesai. Batalkan atau selesaikan token tersebut terlebih dahulu.",
      400
    );
  }

  // Generate 6 digit token
  const tokenCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
  const now = new Date().toISOString();

  // Deduct balance (hold)
  const { error: balErr } = await admin
    .from("profiles")
    .update({
      balance: Number(profile.balance || 0) - amount,
      updated_at: now,
    })
    .eq("id", clientId);

  if (balErr) {
    throw new ApiError("Gagal memperbarui saldo", 500);
  }

  // Insert withdrawal record
  const { data: withdrawal, error: wErr } = await admin
    .from("withdrawals")
    .insert({
      client_id: clientId,
      amount,
      fee_amount: 0,
      net_amount: amount,
      bank_name: "TUNAI_LOKET",
      account_number: tokenCode,
      beneficiary_name: profile.name,
      request_key: crypto.randomUUID(),
      provider_reference_no: "CSH-" + customAlphabet("0123456789ABCDEF", 10)(),
      status: "pending",
      withdrawal_type: "cash_counter",
      token_code: tokenCode,
      token_expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (wErr || !withdrawal) {
    // Revert balance
    await admin
      .from("profiles")
      .update({ balance: profile.balance, updated_at: now })
      .eq("id", clientId);
    throw new ApiError("Gagal membuat token penarikan loket", 500);
  }

  return {
    withdrawalId: withdrawal.id,
    tokenCode,
    expiresAt,
    amount,
  };
}

export async function verifyCounterToken(
  tokenCode: string
): Promise<CounterWithdrawalVerification> {
  const cleanToken = tokenCode.trim();
  if (!cleanToken) {
    throw new ApiError("Token harus diisi", 400);
  }

  const admin = createAdminClient();

  const { data: withdrawal, error } = await admin
    .from("withdrawals")
    .select(`
      id,
      amount,
      token_code,
      token_expires_at,
      status,
      profiles!client_id (
        id,
        name,
        account_number,
        balance,
        avatar_url
      )
    `)
    .eq("token_code", cleanToken)
    .eq("withdrawal_type", "cash_counter")
    .maybeSingle();

  if (error || !withdrawal) {
    throw new ApiError("Kode token penarikan tidak ditemukan atau tidak valid", 404);
  }

  if (withdrawal.status !== "pending") {
    throw new ApiError(`Token ini sudah berstatus '${withdrawal.status}'`, 400);
  }

  const clientData = Array.isArray(withdrawal.profiles)
    ? withdrawal.profiles[0]
    : withdrawal.profiles;

  const isExpired = withdrawal.token_expires_at
    ? new Date(withdrawal.token_expires_at) < new Date()
    : false;

  return {
    withdrawalId: withdrawal.id,
    tokenCode: withdrawal.token_code || cleanToken,
    amount: Number(withdrawal.amount),
    client: {
      id: clientData?.id || "",
      name: clientData?.name || "Nasabah",
      account_number: clientData?.account_number || null,
      balance: Number(clientData?.balance || 0),
      avatar_url: clientData?.avatar_url || null,
    },
    expiresAt: withdrawal.token_expires_at || "",
    isExpired,
  };
}

export async function executeCounterWithdrawal(
  adminId: string,
  tokenCode: string
): Promise<CounterWithdrawalVerification> {
  const verification = await verifyCounterToken(tokenCode);

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (verification.isExpired) {
    // Refund balance
    await admin
      .from("profiles")
      .update({
        balance: verification.client.balance + verification.amount,
        updated_at: now,
      })
      .eq("id", verification.client.id);

    await admin
      .from("withdrawals")
      .update({
        status: "failed",
        failure_reason: "Token telah kadaluarsa (30 menit)",
        refunded_at: now,
        completed_at: now,
        updated_at: now,
      })
      .eq("id", verification.withdrawalId);

    throw new ApiError("Token telah kadaluarsa. Saldo otomatis dikembalikan ke akun nasabah.", 400);
  }

  // Approve and mark completed
  const { error: updErr } = await admin
    .from("withdrawals")
    .update({
      status: "success",
      approved_at: now,
      completed_at: now,
      served_by_admin_id: adminId,
      updated_at: now,
    })
    .eq("id", verification.withdrawalId);

  if (updErr) {
    throw new ApiError(`Gagal menyelesaikan penarikan: ${updErr.message}`, 500);
  }

  // Audit log
  await admin.from("audit_logs").insert({
    actor_id: adminId,
    action: "counter.cash_withdrawal_executed",
    target_type: "withdrawal",
    target_id: verification.withdrawalId,
    details: {
      client_id: verification.client.id,
      amount: verification.amount,
      token_code: tokenCode,
    },
  });

  return verification;
}

export async function getCounterHistory(limit = 30): Promise<CounterHistoryItem[]> {
  const admin = createAdminClient();

  // Fetch drop-off tickets
  const { data: tickets } = await admin
    .from("tickets")
    .select(`
      id,
      short_id,
      payment_method,
      status,
      created_at,
      profiles!client_id (name, account_number),
      transaction_details (weight, subtotal)
    `)
    .eq("service_type", "drop_off")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Fetch cash counter withdrawals
  const { data: withdrawals } = await admin
    .from("withdrawals")
    .select(`
      id,
      provider_reference_no,
      amount,
      status,
      created_at,
      profiles!client_id (name, account_number)
    `)
    .eq("withdrawal_type", "cash_counter")
    .order("created_at", { ascending: false })
    .limit(limit);

  interface TicketRow {
    id: string;
    short_id: string | null;
    payment_method: "cash" | "balance" | null;
    status: string;
    created_at: string;
    profiles: { name: string; account_number: string | null } | { name: string; account_number: string | null }[] | null;
    transaction_details: { weight: number; subtotal: number }[] | null;
  }

  interface WithdrawalRow {
    id: string;
    provider_reference_no: string | null;
    amount: number;
    status: string;
    created_at: string;
    profiles: { name: string; account_number: string | null } | { name: string; account_number: string | null }[] | null;
  }

  const history: CounterHistoryItem[] = [];

  ((tickets as unknown as TicketRow[]) || []).forEach((t) => {
    const client = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
    const details = t.transaction_details || [];
    const totalAmount = details.reduce((sum, d) => sum + (Number(d.subtotal) || 0), 0);
    const totalWeight = details.reduce((sum, d) => sum + (Number(d.weight) || 0), 0);

    history.push({
      id: t.id,
      type: "drop_off",
      referenceCode: t.short_id || t.id.substring(0, 8).toUpperCase(),
      clientName: client?.name || "Nasabah",
      clientAccountNumber: client?.account_number || null,
      amount: totalAmount,
      weight: totalWeight,
      paymentMethod: t.payment_method || "balance",
      status: t.status,
      createdAt: t.created_at,
    });
  });

  ((withdrawals as unknown as WithdrawalRow[]) || []).forEach((w) => {
    const client = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;

    history.push({
      id: w.id,
      type: "cash_counter_withdrawal",
      referenceCode: w.provider_reference_no || w.id.substring(0, 8).toUpperCase(),
      clientName: client?.name || "Nasabah",
      clientAccountNumber: client?.account_number || null,
      amount: Number(w.amount),
      status: w.status,
      createdAt: w.created_at,
    });
  });

  // Sort by date descending
  return history.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
