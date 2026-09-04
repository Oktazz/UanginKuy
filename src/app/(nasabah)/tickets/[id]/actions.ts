"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export type CancelTicketResult = {
  success: boolean;
  error?: string;
};

export async function cancelTicket(
  ticketId: string,
  reason: string = "Dibatalkan oleh nasabah",
): Promise<CancelTicketResult> {
  try {
    const supabase = await createClient(await cookies());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesi Anda telah berakhir. Silakan login kembali." };
    }

    // Verify ticket ownership and fetch current status
    let query = supabase
      .from("tickets")
      .select("id, short_id, client_id, status, courier_id, pickup_date")
      .eq("client_id", user.id);

    if (ticketId.length === 8) {
      query = query.eq("short_id", ticketId.toUpperCase());
    } else {
      query = query.eq("id", ticketId);
    }

    const { data: ticket, error: fetchError } = await query.maybeSingle();

    if (fetchError || !ticket) {
      return {
        success: false,
        error: "Tiket tidak ditemukan atau Anda tidak memiliki akses untuk membatalkan tiket ini.",
      };
    }

    if (ticket.status === "cancelled") {
      return { success: false, error: "Tiket penjemputan ini sudah dibatalkan sebelumnya." };
    }

    if (ticket.status === "completed") {
      return { success: false, error: "Tiket yang sudah selesai tidak dapat dibatalkan." };
    }

    if (ticket.status === "on_the_way") {
      return {
        success: false,
        error:
          "Kurir sedang dalam perjalanan menuju lokasi Anda. Silakan hubungi kurir langsung via WhatsApp untuk pembatalan mendesak.",
      };
    }

    if (ticket.status !== "pending" && ticket.status !== "scheduled") {
      return {
        success: false,
        error: `Tiket dengan status '${ticket.status}' tidak dapat dibatalkan.`,
      };
    }

    const admin = createAdminClient();

    // 1. Update ticket status to cancelled and unassign courier/route sequence
    const { error: updateError } = await admin
      .from("tickets")
      .update({
        status: "cancelled",
        route_sequence: null,
        courier_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Gagal memperbarui status tiket:", updateError);
      return {
        success: false,
        error: "Gagal membatalkan tiket di database. Silakan coba lagi.",
      };
    }

    // 2. Record event in audit_logs
    try {
      await admin.from("audit_logs").insert({
        action: "TICKET_CANCELLED",
        actor_id: user.id,
        target_type: "ticket",
        target_id: ticket.id,
        details: {
          reason: reason.trim() || "Tidak disebutkan",
          ticket_short_id: ticket.short_id,
          previous_status: ticket.status,
          previous_courier_id: ticket.courier_id,
          pickup_date: ticket.pickup_date,
          cancelled_at: new Date().toISOString(),
          cancelled_by: "nasabah",
        },
      });
    } catch (auditError) {
      console.warn("Gagal mencatat audit log pembatalan tiket:", auditError);
      // Non-critical, continue
    }

    // 3. Revalidate affected pages
    revalidatePath("/tickets");
    revalidatePath(`/tickets/${ticket.id}`);
    if (ticket.short_id) {
      revalidatePath(`/tickets/${ticket.short_id}`);
    }
    revalidatePath("/admin/routes");
    revalidatePath("/kurir/dashboard");

    return { success: true };
  } catch (err) {
    console.error("Kesalahan tak terduga saat membatalkan tiket:", err);
    return {
      success: false,
      error: "Terjadi kesalahan internal. Silakan coba beberapa saat lagi.",
    };
  }
}
