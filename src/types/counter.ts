export interface NasabahSearchRecord {
  id: string;
  name: string;
  account_number: string | null;
  phone_number?: string | null;
  balance: number;
  avatar_url?: string | null;
  address?: string | null;
  city?: string | null;
  joined_at?: string | null;
}

export interface DropoffItemInput {
  wasteCategoryId: number;
  weight: number;
  priceApplied: number;
  subtotal: number;
}

export interface DropoffSubmissionPayload {
  clientId: string;
  ticketId?: string | null;
  paymentMethod: "cash" | "balance";
  items: DropoffItemInput[];
}

export interface DropoffTransactionResult {
  ticketId: string;
  ticketShortId: string | null;
  clientId: string;
  clientName: string;
  paymentMethod: "cash" | "balance";
  totalWeight: number;
  totalAmount: number;
  carbonSaved: number;
  completedAt: string;
}

export interface CounterWithdrawalVerification {
  withdrawalId: string;
  tokenCode: string;
  amount: number;
  client: {
    id: string;
    name: string;
    account_number: string | null;
    balance: number;
    avatar_url: string | null;
  };
  expiresAt: string;
  isExpired: boolean;
}

export interface CounterHistoryItem {
  id: string;
  type: "drop_off" | "cash_counter_withdrawal";
  referenceCode: string;
  clientName: string;
  clientAccountNumber: string | null;
  amount: number;
  weight?: number;
  paymentMethod?: "cash" | "balance";
  status: string;
  createdAt: string;
}
