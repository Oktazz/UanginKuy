"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { geocodeWithFallbacks } from "@/utils/geocoding";
import { useToast } from "@/components/ui/ToastProvider";
import { EMPTY_ADDRESS_FORM, type Address, type AddressFormState } from "./types";

export function useAddressBook() {
  const toast = useToast();

  // List state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Form mode state
  const [formMode, setFormMode] = useState<"none" | "add" | "edit">("none");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState<AddressFormState>(EMPTY_ADDRESS_FORM);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Debounce timer — never rendered, use ref
  const geocodingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patchForm = useCallback((patch: Partial<AddressFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetForm = useCallback(() => {
    setFormMode("none");
    setEditingAddressId(null);
    setForm(EMPTY_ADDRESS_FORM);
  }, []);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/addresses");
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data as Address[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial-load + refresh after mutations
    void fetchAddresses();
  }, [fetchAddresses]);

  const handleManualGeocode = useCallback(
    async (silent = false) => {
      if (!form.fullAddress || form.fullAddress.length < 5) return;
      setIsGeocoding(true);
      try {
        const queries = [
          `${form.fullAddress}, ${form.district}, ${form.city}, ${form.province}`,
          `${form.district}, ${form.city}, ${form.province}`,
          `${form.city}, ${form.province}`,
        ];
        const coords = await geocodeWithFallbacks(queries);

        if (coords) {
          patchForm({ mapCenter: coords, location: coords });
          setMapError(null);
        } else if (!silent) {
          setMapError("Lokasi presisi tidak ditemukan, silakan geser peta secara manual.");
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      } finally {
        setIsGeocoding(false);
      }
    },
    [form.fullAddress, form.district, form.city, form.province, patchForm],
  );

  // Geocoding Debounce
  useEffect(() => {
    if (!form.fullAddress || form.fullAddress.length < 5) return;
    if (geocodingTimerRef.current) clearTimeout(geocodingTimerRef.current);
    const timer = setTimeout(() => {
      void handleManualGeocode(true);
    }, 1500);
    geocodingTimerRef.current = timer;
    return () => clearTimeout(timer);
  }, [form.fullAddress, form.district, form.city, form.province, handleManualGeocode]);

  const handleStartAdd = useCallback(() => {
    resetForm();
    setFormMode("add");
    setEditingAddressId(null);
    patchForm({ isPrimary: addresses.length === 0 });
  }, [addresses.length, resetForm, patchForm]);

  const handleStartEdit = useCallback((address: Address) => {
    setFormMode("edit");
    setEditingAddressId(address.id);
    const coords =
      address.latitude != null && address.longitude != null
        ? { lat: Number(address.latitude), lng: Number(address.longitude) }
        : null;
    setForm({
      label: address.label || "",
      recipientName: address.recipient_name || "",
      phoneNumber: address.phone_number || "",
      province: address.province || "",
      city: address.city || "",
      district: address.district || "",
      fullAddress: address.full_address || "",
      location: coords,
      mapCenter: coords,
      isPrimary: !!address.is_primary,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (
        !form.label ||
        !form.recipientName ||
        !form.phoneNumber ||
        !form.province ||
        !form.city ||
        !form.district ||
        !form.fullAddress ||
        !form.location
      ) {
        return;
      }

      setSubmitting(true);
      try {
        const url = formMode === "edit" ? `/api/addresses/${editingAddressId}` : "/api/addresses";
        const method = formMode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label,
            recipient_name: form.recipientName,
            phone_number: form.phoneNumber,
            province: form.province,
            city: form.city,
            district: form.district,
            full_address: form.fullAddress,
            latitude: form.location.lat,
            longitude: form.location.lng,
            is_primary: form.isPrimary || (formMode === "add" && addresses.length === 0),
          }),
        });

        const data = await res.json();
        if (data.success) {
          resetForm();
          toast({
            type: "success",
            message:
              formMode === "edit"
                ? "Alamat berhasil diperbarui."
                : "Alamat baru berhasil ditambahkan.",
          });
          void fetchAddresses();
        } else {
          toast({
            type: "error",
            message: data.message || data.error || "Gagal menyimpan alamat.",
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          type: "error",
          message: "Terjadi kesalahan saat menyimpan alamat.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [form, formMode, editingAddressId, addresses.length, resetForm, toast, fetchAddresses],
  );

  const handleSetPrimary = useCallback(
    (addressId: string) => {
      const prev = addresses;
      // Optimistic: langsung update is_primary di state lokal
      setAddresses((cur) =>
        cur.map((a) => ({ ...a, is_primary: a.id === addressId }))
      );

      // API di background
      fetch(`/api/addresses/${addressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_primary: true }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast({ type: "success", message: "Alamat utama berhasil diperbarui." });
          } else {
            setAddresses(prev);
            toast({
              type: "error",
              message: data.message || data.error || "Gagal memperbarui alamat utama.",
            });
          }
        })
        .catch((err) => {
          console.error(err);
          setAddresses(prev);
          toast({ type: "error", message: "Koneksi gagal. Alamat dikembalikan." });
        });
    },
    [addresses, toast],
  );

  const handleDeleteAddress = useCallback(
    (address: Address) => {
      const prev = addresses;
      setDeletingAddress(null); // Tutup modal instan
      setRemovingId(address.id); // Mulai animasi fade-out

      // Hapus dari state setelah animasi CSS selesai
      setTimeout(() => {
        setAddresses((cur) => cur.filter((a) => a.id !== address.id));
        setRemovingId(null);
      }, 300);

      fetch(`/api/addresses/${address.id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast({ type: "success", message: "Alamat berhasil dihapus." });
          } else {
            setAddresses(prev);
            setRemovingId(null);
            toast({ type: "error", message: data.message || data.error || "Gagal menghapus alamat." });
          }
        })
        .catch((err) => {
          console.error(err);
          setAddresses(prev);
          setRemovingId(null);
          toast({ type: "error", message: "Koneksi gagal. Alamat dikembalikan." });
        });
    },
    [addresses, toast],
  );

  return {
    // List
    addresses,
    loading,
    removingId,
    // Form
    formMode,
    form,
    submitting,
    isGeocoding,
    mapError,
    // Delete dialog
    deletingAddress,
    // Actions
    patchForm,
    startAdd: handleStartAdd,
    startEdit: handleStartEdit,
    submitForm: handleFormSubmit,
    setPrimary: handleSetPrimary,
    autoPin: () => handleManualGeocode(false),
    openDeleteDialog: (address: Address) => setDeletingAddress(address),
    closeDeleteDialog: () => setDeletingAddress(null),
    confirmDelete: handleDeleteAddress,
    cancelForm: resetForm,
  };
}