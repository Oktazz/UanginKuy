export type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone_number: string;
  province: string;
  city: string;
  district: string;
  full_address: string;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
};

export type AddressFormState = {
  label: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  district: string;
  fullAddress: string;
  location: { lat: number; lng: number } | null;
  mapCenter: { lat: number; lng: number } | null;
  isPrimary: boolean;
};

export const EMPTY_ADDRESS_FORM: AddressFormState = {
  label: "",
  recipientName: "",
  phoneNumber: "",
  province: "",
  city: "",
  district: "",
  fullAddress: "",
  location: null,
  mapCenter: null,
  isPrimary: false,
};