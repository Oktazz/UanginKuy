import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import WithdrawalClient from "./WithdrawalClient";

export default async function WithdrawalPage() {
  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();

  return <WithdrawalClient currentBalance={Number(profile?.balance ?? 0)} />;
}
