"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

import type { OnboardingDestination } from "@/components/ui/OnboardingDialog";

const DestinationSchema = z.enum(["dashboard", "booking"]);
const destinationPaths = {
  dashboard: "/dashboard",
  booking: "/booking",
} as const;

export async function completeOnboarding(
  destination: OnboardingDestination,
) {
  const parsedDestination = DestinationSchema.safeParse(destination);
  if (!parsedDestination.success) redirect("/dashboard");

  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "nasabah") redirect("/dashboard");

  const redirectPath = destinationPaths[parsedDestination.data];
  if (profile.onboarding_completed_at) redirect(redirectPath);

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .eq("role", "nasabah");

  if (error) {
    redirect(
      `/dashboard?onboardingError=${encodeURIComponent(
        "Gagal menyimpan status onboarding. Silakan coba lagi.",
      )}`,
    );
  }

  revalidatePath("/", "layout");
  redirect(redirectPath);
}
