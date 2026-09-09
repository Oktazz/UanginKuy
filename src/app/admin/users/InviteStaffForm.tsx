"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MailPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/Input";
import {
  inviteStaff,
  type InviteStaffState,
} from "./actions";

const initialInviteStaffState: InviteStaffState = {
  status: "idle",
  message: "",
};

const roleOptions = [
  {
    value: "kurir",
    label: "Kurir",
    description: "Mengakses rute, scanner, dan proses pickup.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Mengelola operasional tanpa akses super admin.",
  },
];

export function InviteStaffForm() {
  const [role, setRole] = useState("kurir");
  const [state, formAction, isPending] = useActionState(
    inviteStaff,
    initialInviteStaffState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm lg:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailPlus size={24} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">
            Undang Pengguna Staf
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Pengguna akan menerima email untuk mengaktifkan akun dan membuat
            password.
          </p>
        </div>
      </div>

      <form ref={formRef} action={formAction} className="space-y-5">
        <div>
          <label
            htmlFor="staff-name"
            className="mb-2 block text-sm font-bold text-gray-700"
          >
            Nama lengkap
          </label>
          <Input
            id="staff-name"
            name="name"
            autoComplete="name"
            placeholder="Contoh: Made Pratama"
            minLength={2}
            maxLength={100}
            required
          />
        </div>

        <div>
          <label
            htmlFor="staff-email"
            className="mb-2 block text-sm font-bold text-gray-700"
          >
            Email
          </label>
          <Input
            id="staff-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@uanginkuy.id"
            required
          />
        </div>

        <div>
          <label
            htmlFor="staff-role"
            className="mb-2 block text-sm font-bold text-gray-700"
          >
            Role
          </label>
          <CustomSelect
            id="staff-role"
            options={roleOptions}
            value={role}
            onChange={setRole}
            triggerClassName="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900"
          />
          <input type="hidden" name="role" value={role} />
        </div>

        {state.status !== "idle" && (
          <div
            role={state.status === "error" ? "alert" : "status"}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
              state.status === "success"
                ? "bg-success/10 text-success"
                : "bg-error/10 text-error"
            }`}
          >
            {state.message}
          </div>
        )}

        <Button
          type="submit"
          loading={isPending}
          loadingLabel="Mengirim undangan..."
          className="h-12 w-full rounded-xl font-bold cursor-pointer"
        >
          <MailPlus size={18} className="mr-2" aria-hidden="true" />
          Kirim Undangan
        </Button>
      </form>
    </section>
  );
}
