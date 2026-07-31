"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const PasswordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmation"],
  });

export async function setInvitedUserPassword(formData: FormData) {
  const parsed = PasswordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    redirect(
      `/set-password?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Password tidak valid.",
      )}`,
    );
  }

  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/set-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding");
}
