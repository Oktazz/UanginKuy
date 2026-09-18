import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ApiError } from "@/utils/error-handler";

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
    throw new ApiError("Sesi tidak valid. Silakan masuk kembali.", 401);
  }

  const role = auth.profile?.role;
  if (role !== "admin" && role !== "super_admin") {
    throw new ApiError("Aksi ini membutuhkan hak akses admin.", 403);
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
    throw new ApiError("Sesi tidak valid. Silakan masuk kembali.", 401);
  }

  if (auth.profile?.role !== "super_admin") {
    throw new ApiError("Aksi ini hanya dapat dilakukan oleh super admin.", 403);
  }

  return {
    ...auth,
    user: auth.user,
    profile: auth.profile,
  };
}
