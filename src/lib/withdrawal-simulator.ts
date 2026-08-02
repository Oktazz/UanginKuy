export type WithdrawalBank = {
  code: string;
  name: string;
};

export const WITHDRAWAL_FEE = 0;

export const WITHDRAWAL_BANKS: WithdrawalBank[] = [
  { code: "bca", name: "Bank Central Asia (BCA)" },
  { code: "bni", name: "Bank Negara Indonesia (BNI)" },
  { code: "bri", name: "Bank Rakyat Indonesia (BRI)" },
  { code: "bsi", name: "Bank Syariah Indonesia (BSI)" },
  { code: "btn", name: "Bank Tabungan Negara (BTN)" },
  { code: "cimb", name: "CIMB Niaga" },
  { code: "danamon", name: "Bank Danamon" },
  { code: "mandiri", name: "Bank Mandiri" },
  { code: "permata", name: "PermataBank" },
];

export function validateSimulatedBankAccount(
  bankCode: string,
  accountNumber: string,
  accountName: string,
) {
  const bank = WITHDRAWAL_BANKS.find((item) => item.code === bankCode);
  if (!bank) throw new Error("Bank tujuan tidak didukung.");

  return {
    accountName,
    accountNumber,
    bankName: bank.name,
  };
}
