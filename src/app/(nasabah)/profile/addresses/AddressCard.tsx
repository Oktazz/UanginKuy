import { MapPin, Pencil, Star, Tag, Trash2 } from "lucide-react";
import type { Address } from "./types";

interface AddressCardProps {
  address: Address;
  isRemoving: boolean;
  onSetPrimary: (addressId: string) => void;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
}

export function AddressCard({
  address,
  isRemoving,
  onSetPrimary,
  onEdit,
  onDelete,
}: AddressCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(48,109,41,0.10)] transition-all duration-200 flex flex-col justify-between ${
        isRemoving ? "item-exiting" : ""
      }`}
    >
      {/* Card Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Tag size={14} className="text-primary" />
            </div>
            <span className="font-bold text-gray-900 text-sm">{address.label}</span>
            {address.is_primary && (
              <span className="inline-flex items-center space-x-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Star size={8} fill="currentColor" />
                <span>Utama</span>
              </span>
            )}
          </div>
        </div>

        {/* Recipient */}
        <p className="text-sm font-semibold text-gray-800 mb-0.5">
          {address.recipient_name}
        </p>
        <p className="text-xs text-gray-500 mb-2">{address.phone_number}</p>

        {/* Address Detail */}
        <div className="flex items-start space-x-1.5 mt-2">
          <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-700 leading-relaxed">{address.full_address}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {address.district}, {address.city}, {address.province}
            </p>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
        <div>
          {!address.is_primary ? (
            <button
              type="button"
              onClick={() => onSetPrimary(address.id)}
              className="inline-flex items-center space-x-1 text-primary hover:text-primary-dark font-semibold transition-colors cursor-pointer"
            >
              <Star size={13} />
              <span>Jadikan Utama</span>
            </button>
          ) : (
            <span className="text-gray-400 inline-flex items-center space-x-1 font-medium">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span className="text-gray-600">Alamat Utama</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onEdit(address)}
            className="inline-flex items-center space-x-1 text-gray-600 hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-colors font-semibold cursor-pointer"
          >
            <Pencil size={13} />
            <span>Ubah</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(address)}
            className="inline-flex items-center space-x-1 text-gray-400 hover:text-error px-2.5 py-1.5 rounded-lg hover:bg-error/5 transition-colors font-semibold cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </div>
  );
}