import type { WithdrawalRecord } from "@/services/withdrawal.service";

export type Bank = {
  code: string;
  name: string;
};

export type ActiveCounterToken = {
  tokenCode: string;
  expiresAt: string;
  amount: number;
  withdrawalId: string;
};

export type { WithdrawalRecord };
