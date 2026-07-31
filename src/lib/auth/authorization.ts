import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type AppRole = "nasabah" | "kurir" | "admin" | "super_admin";

export async function getAuthenticatedProfile() {
  const supabase = await createClient(await cookies());
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const auth = await getAuthenticatedProfile();

  if (!auth.user) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali.");
  }

  const role = auth.profile?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Aksi ini membutuhkan hak akses admin.");
  }

  return {
    ...auth,
    user: auth.user,
    profile: auth.profile,
  };
}

export async function requireSuperAdmin() {
  const auth = await getAuthenticatedProfile();

  if (!auth.user) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali.");
  }

  if (auth.profile?.role !== "super_admin") {
    throw new Error("Aksi ini hanya dapat dilakukan oleh super admin.");
  }

  return {
    ...auth,
    user: auth.user,
    profile: auth.profile,
  };
}
