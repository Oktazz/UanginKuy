import { requireAdmin } from "@/lib/auth/authorization";
import NasabahListClient from "./_components/NasabahListClient";

export default async function AdminNasabahPage() {
  await requireAdmin();

  return (
    <div className="animate-in fade-in duration-500">
      <NasabahListClient />
    </div>
  );
}
