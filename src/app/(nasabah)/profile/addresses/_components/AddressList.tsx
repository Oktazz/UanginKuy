import { MapPin, Plus } from "lucide-react";
import { AddressCard } from "./AddressCard";
import type { Address } from "../types";

interface AddressListProps {
  loading: boolean;
  addresses: Address[];
  removingId: string | null;
  onAdd: () => void;
  onSetPrimary: (addressId: string) => void;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
}

export function AddressList({
  loading,
  addresses,
  removingId,
  onAdd,
  onSetPrimary,
  onEdit,
  onDelete,
}: AddressListProps) {
  return (
    <div className="space-y-4">
      {/* Tambah Alamat Button */}
      <button
        id="btn-add-address"
        onClick={onAdd}
        className="w-full flex items-center justify-center space-x-2 bg-primary text-white font-bold py-3.5 px-4 rounded-2xl hover:bg-primary-dark active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary/20 cursor-pointer"
      >
        <Plus size={18} />
        <span>Tambah Alamat Baru</span>
      </button>

      {/* Address List */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col justify-between animate-pulse"
            >
              {/* Card Content */}
              <div className="p-4 space-y-3">
                {/* Header: Tag Icon + Label + Primary Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200/80 rounded-lg flex-shrink-0" />
                    <div className="h-4 bg-gray-200/80 rounded-md w-20" />
                    {i === 0 && (
                      <div className="h-4.5 bg-primary/20 rounded-full w-14" />
                    )}
                  </div>
                </div>

                {/* Recipient info */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="h-4 bg-gray-200/80 rounded-md w-32" />
                  <div className="h-3 bg-gray-200/60 rounded-md w-24" />
                </div>

                {/* Address Detail with Pin */}
                <div className="flex items-start space-x-2 pt-1">
                  <div className="w-3.5 h-3.5 bg-gray-200/70 rounded-full flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200/70 rounded-md w-full" />
                    <div className="h-3 bg-gray-200/60 rounded-md w-3/4" />
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                <div className="h-4 bg-gray-200/70 rounded-md w-24" />
                <div className="flex items-center space-x-1.5">
                  <div className="h-7 bg-gray-200/70 rounded-lg w-14" />
                  <div className="h-7 bg-gray-200/70 rounded-lg w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-20 h-20 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center">
            <MapPin size={36} className="text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-gray-800 font-semibold text-base">Belum ada alamat</p>
            <p className="text-gray-400 text-sm mt-1">Tambahkan alamat penjemputan pertama Anda</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isRemoving={removingId === address.id}
              onSetPrimary={onSetPrimary}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}