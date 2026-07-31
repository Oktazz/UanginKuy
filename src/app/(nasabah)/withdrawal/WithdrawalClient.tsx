"use client";

import { useState } from "react";
import { Wallet, Building, CreditCard, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

export default function WithdrawalClient({
  currentBalance,
}: {
  currentBalance: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [provider, setProvider] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) {
      alert("Pilih penyedia layanan terlebih dahulu");
      return;
    }
    setLoading(true);

    // Simulate API call to /api/withdrawals
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    }, 1500);
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-success/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="w-24 h-24 bg-success rounded-full flex items-center justify-center text-white mb-6 relative z-10 shadow-xl shadow-success/30">
            <CheckCircle2 size={48} />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Penarikan Berhasil!</h2>
        <p className="text-gray-500 text-center max-w-xs leading-relaxed">
          Dana Anda akan segera diproses. Anda akan dialihkan ke Dashboard.
        </p>
        <Loader2 className="animate-spin text-primary mt-8" size={24} />
      </div>
    );
  }

  const bankOptions = ["BCA", "Mandiri", "BNI", "BRI", "BSI"];
  const ewalletOptions = ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"];
  const currentOptions = method === "bank" ? bankOptions : ewalletOptions;

  return (
    <div className="mx-auto max-w-2xl pb-12">
      <h1 className="sr-only">Tarik Saldo</h1>
      <header className="relative mb-8 overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-lg sm:p-8">
        <Wallet
          size={64}
          aria-hidden="true"
          className="absolute bottom-4 right-4 opacity-20 sm:bottom-6 sm:right-6"
        />
        <div className="relative">
          <p className="text-sm font-semibold text-white/80">
            Saldo Anda Saat Ini
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {currencyFormatter.format(currentBalance)}
          </h1>
          <p className="mt-3 text-sm font-medium text-white/75">
            Saldo tersedia untuk ditarik ke rekening atau dompet digital.
          </p>
        </div>
      </header>

      <div className="bg-surface p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-125 duration-700"></div>

        <form onSubmit={handleSubmit} className="space-y-8 relative">
          
          {/* Nominal Input */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Nominal Penarikan</label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-400 font-bold group-focus-within/input:text-primary transition-colors">Rp</span>
              </div>
              <input
                type="number"
                min="10000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 w-full h-14 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 text-lg font-bold text-gray-900 placeholder-gray-400"
                placeholder="Contoh: 50000"
              />
            </div>
            <p className="text-xs text-gray-500 font-medium">Minimal penarikan <span className="text-primary">Rp 10.000</span></p>
          </div>

          {/* Method Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Metode Pencairan</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setMethod("bank"); setProvider(""); }}
                className={`flex flex-col items-center justify-center p-4 h-28 rounded-2xl border-2 transition-all duration-300 ${method === "bank" ? "border-primary bg-primary/10 text-primary shadow-sm transform scale-[1.02]" : "border-gray-100 bg-gray-50/50 text-gray-500 hover:border-primary/40 hover:bg-white"}`}
              >
                <Building size={32} className="mb-3" />
                <span className="text-sm font-bold">Transfer Bank</span>
              </button>
              <button
                type="button"
                onClick={() => { setMethod("ewallet"); setProvider(""); }}
                className={`flex flex-col items-center justify-center p-4 h-28 rounded-2xl border-2 transition-all duration-300 ${method === "ewallet" ? "border-primary bg-primary/10 text-primary shadow-sm transform scale-[1.02]" : "border-gray-100 bg-gray-50/50 text-gray-500 hover:border-primary/40 hover:bg-white"}`}
              >
                <CreditCard size={32} className="mb-3" />
                <span className="text-sm font-bold">E-Wallet</span>
              </button>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
              Pilih {method === "bank" ? "Bank Tujuan" : "Penyedia E-Wallet"}
            </label>
            <div className="relative z-20">
              <CustomSelect 
                options={currentOptions}
                value={provider}
                onChange={setProvider}
                placeholder={`Pilih ${method === "bank" ? "Bank" : "E-Wallet"}...`}
              />
            </div>
          </div>

          {/* Account Number Input */}
          <div className="space-y-3 relative z-10">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
              {method === "bank" ? "Nomor Rekening" : "Nomor Handphone"}
            </label>
            <input
              type="text"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full h-14 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 px-4 font-medium text-gray-900 placeholder-gray-400"
              placeholder={method === "bank" ? "Masukkan No Rekening Anda" : "Contoh: 081234567890"}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-surface font-extrabold text-lg rounded-2xl hover:bg-primary-dark shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none flex items-center justify-center group"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Tarik Sekarang <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
