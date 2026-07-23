import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import PriceClient from "./PriceClient";

export default async function PricesPage() {
  const supabase = await createClient(await cookies());

  const { data: categories } = await supabase
    .from("waste_categories")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="animate-in fade-in duration-500">
      <PriceClient categories={categories || []} />
    </div>
  );
}
