import { MapPin, Plus } from "lucide-react";
import { AddressCard } from "./AddressCard";
import type { Address } from "./types";

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between h-48 animate-pulse">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-4/5" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="flex items-center space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-12" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
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