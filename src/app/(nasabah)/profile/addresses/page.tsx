"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAddressBook } from "./useAddressBook";
import { AddressList } from "./AddressList";
import { AddressForm } from "./AddressForm";
import { DeleteAddressDialog } from "./DeleteAddressDialog";

export default function AddressBookPage() {
  const {
    addresses,
    loading,
    formMode,
    form,
    submitting,
    isGeocoding,
    mapError,
    deletingAddress,
    removingId,
    patchForm,
    startAdd,
    startEdit,
    submitForm,
    setPrimary,
    autoPin,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    cancelForm,
  } = useAddressBook();

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-4">
      {/* Page Header */}
      <header className="flex items-center space-x-3">
        <Link
          href="/profile"
          className="w-9 h-9 bg-surface border border-gray-200 rounded-xl flex items-center justify-center shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer flex-shrink-0"
          aria-label="Kembali ke profil"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Buku Alamat</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola lokasi penjemputan Anda.</p>
        </div>
      </header>

      <div>
        {formMode === "none" ? (
          <AddressList
            loading={loading}
            addresses={addresses}
            removingId={removingId}
            onAdd={startAdd}
            onSetPrimary={setPrimary}
            onEdit={startEdit}
            onDelete={openDeleteDialog}
          />
        ) : (
          <AddressForm
            mode={formMode}
            form={form}
            hasAddresses={addresses.length > 0}
            isSubmitting={submitting}
            isGeocoding={isGeocoding}
            mapError={mapError}
            onChange={patchForm}
            onAutoPin={autoPin}
            onSubmit={submitForm}
            onCancel={cancelForm}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingAddress && (
        <DeleteAddressDialog
          address={deletingAddress}
          hasOtherAddresses={addresses.length > 1}
          onConfirm={confirmDelete}
          onCancel={closeDeleteDialog}
        />
      )}
    </div>
  );
}