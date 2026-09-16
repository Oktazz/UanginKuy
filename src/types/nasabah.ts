export interface NasabahListItem {
  id: string;
  name: string;
  account_number: string | null;
  balance: number;
  avatar_url: string | null;
  created_at: string;
  phone_number: string | null;
  full_address: string | null;
  city: string | null;
  district: string | null;
  total_tickets_count?: number;
  total_withdrawals_count?: number;
}

export interface NasabahSummaryMetrics {
  totalNasabah: number;
  totalBalance: number;
  activeNasabahCount: number;
}

export interface NasabahWasteDetailItem {
  categoryName: string;
  weight: number;
  priceApplied: number;
  subtotal: number;
}

export interface NasabahWasteDepositItem {
  id: string;
  shortId: string | null;
  serviceType: "pickup" | "drop_off";
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  pickupDate: string | null;
  totalWeight: number;
  totalAmount: number;
  items: NasabahWasteDetailItem[];
}

export interface NasabahWithdrawalItem {
  id: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  bankName: string;
  accountNumber: string;
  withdrawalType: "bank_transfer" | "cash_counter" | null;
  tokenCode: string | null;
  status: "pending" | "processing" | "success" | "failed";
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
  refundedAt: string | null;
}

export interface NasabahAddressItem {
  id: string;
  label: string;
  recipientName: string | null;
  phoneNumber: string | null;
  fullAddress: string;
  district: string | null;
  city: string | null;
  isPrimary: boolean;
}

export interface NasabahDetailData {
  profile: {
    id: string;
    name: string;
    accountNumber: string | null;
    balance: number;
    avatarUrl: string | null;
    createdAt: string;
  };
  statistics: {
    totalWasteWeight: number;
    totalWasteEarnings: number;
    totalWithdrawn: number;
    totalDepositsCount: number;
    totalWithdrawalsCount: number;
  };
  addresses: NasabahAddressItem[];
  wasteDeposits: NasabahWasteDepositItem[];
  withdrawals: NasabahWithdrawalItem[];
}
