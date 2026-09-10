import { AlertTriangle, Tag, Trash2, X } from "lucide-react";
import type { Address } from "./types";

interface DeleteAddressDialogProps {
  address: Address;
  hasOtherAddresses: boolean;
  onConfirm: (address: Address) => void;
  onCancel: () => void;
}

export function DeleteAddressDialog({
  address,
  hasOtherAddresses,
  onConfirm,
  onCancel,
}: DeleteAddressDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Hapus Alamat</h3>
            <p className="text-xs text-gray-500 mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1.5 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <Tag size={13} className="text-primary" />
            <span className="font-bold text-gray-900">{address.label}</span>
            {address.is_primary && (
              <span className="bg-primary/10 text-primary font-bold text-[10px] px-2 py-0.5 rounded-full">
                Utama
              </span>
            )}
          </div>
          <p className="font-medium text-gray-800">{address.recipient_name} ({address.phone_number})</p>
          <p className="text-gray-500 leading-relaxed">{address.full_address}</p>
        </div>

        {address.is_primary && hasOtherAddresses && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl leading-relaxed">
            <strong>Catatan:</strong> Alamat ini adalah alamat utama Anda. Setelah dihapus, salah satu alamat Anda yang lain akan otomatis dijadikan alamat utama.
          </p>
        )}

        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-xs cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(address)}
            className="flex-1 bg-error text-white font-bold py-3 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-error/20 cursor-pointer"
          >
            <Trash2 size={15} />
            <span>Ya, Hapus</span>
          </button>
        </div>
      </div>
    </div>
  );
}