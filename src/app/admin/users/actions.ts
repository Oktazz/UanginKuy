"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/utils/supabase/admin";

const InviteStaffSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100),
  email: z.string().trim().toLowerCase().email("Alamat email tidak valid."),
  role: z.enum(["admin", "kurir"], {
    message: "Role hanya boleh admin atau kurir.",
  }),
});

export type InviteStaffState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function inviteStaff(
  _previousState: InviteStaffState,
  formData: FormData,
): Promise<InviteStaffState> {
  const parsed = InviteStaffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Data undangan tidak valid.",
    };
  }

  let actorId: string;

  try {
    const { user } = await requireSuperAdmin();
    actorId = user.id;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Akses ditolak.",
    };
  }

  const admin = createAdminClient();
  const { name, email, role } = parsed.data;
  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name },
    });

  if (inviteError || !inviteData.user) {
    let errorMessage = inviteError?.message;
    if (errorMessage === "{}" || !errorMessage) {
      errorMessage =
        "Gagal mengirim email undangan. Silakan periksa kembali konfigurasi SMTP (seperti App Password atau Port) di Supabase.";
    }
    return {
      status: "error",
      message: errorMessage,
    };
  }

  const invitedUserId = inviteData.user.id;
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      name,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitedUserId);

  if (profileError) {
    await admin.auth.admin.deleteUser(invitedUserId);
    return {
      status: "error",
      message: "Undangan dibatalkan karena role pengguna gagal disimpan.",
    };
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: actorId,
    action: "staff.invited",
    target_type: "profile",
    target_id: invitedUserId,
    details: { email, name, role },
  });

  if (auditError) {
    await admin.auth.admin.deleteUser(invitedUserId);
    return {
      status: "error",
      message: "Undangan dibatalkan karena audit log gagal dicatat.",
    };
  }

  revalidatePath("/admin/users");

  return {
    status: "success",
    message: `Undangan ${role === "admin" ? "admin" : "kurir"} berhasil dikirim ke ${email}.`,
  };
}
