import React from "react";

export interface ThermalReceiptItem {
  categoryName: string;
  weight: number;
  priceApplied: number;
  subtotal: number;
}

export interface ThermalDropoffReceiptData {
  ticketId: string;
  ticketShortId?: string | null;
  clientName: string;
  clientAccountNumber?: string | null;
  paymentMethod: "cash" | "balance";
  totalWeight: number;
  totalAmount: number;
  carbonSaved: number;
  completedAt: string;
  cashierName?: string | null;
  items?: ThermalReceiptItem[];
}

export interface ThermalCashoutReceiptData {
  withdrawalId: string;
  tokenCode: string;
  amount: number;
  clientName: string;
  clientAccountNumber?: string | null;
  remainingBalance?: number | null;
  cashierName?: string | null;
  completedAt?: string;
}

export interface ThermalReceiptProps {
  type: "dropoff" | "cashout";
  data: ThermalDropoffReceiptData | ThermalCashoutReceiptData;
  unitName?: string;
  branchAddress?: string;
  npwp?: string;
  contactNumber?: string;
}

function formatNum(num: number): string {
  return Math.round(num).toLocaleString("id-ID");
}

function formatDateTime(isoString?: string): string {
  const d = isoString ? new Date(isoString) : new Date();
  if (isNaN(d.getTime())) {
    return new Date()
      .toISOString()
      .replace(/T/, " ")
      .substring(2, 16);
  }
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yy}-${hh}:${min}`;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  type,
  data,
  unitName = "UNIT LOKET PUSAT & RECYCLE",
  branchAddress = "JL. RAYA BANK SAMPAH NO. 88",
  npwp = "NPWP: 31.425.889.2-401.000",
  contactNumber = "0812-8899-7766",
}) => {
  const isDropoff = type === "dropoff";
  const dropoffData = isDropoff ? (data as ThermalDropoffReceiptData) : null;
  const cashoutData = !isDropoff ? (data as ThermalCashoutReceiptData) : null;

  const refNumber = isDropoff
    ? dropoffData?.ticketShortId ||
      dropoffData?.ticketId?.substring(0, 8).toUpperCase() ||
      "UK-LOKET"
    : cashoutData?.tokenCode ||
      cashoutData?.withdrawalId?.substring(0, 8).toUpperCase() ||
      "UK-KASIR";

  const cashier = isDropoff
    ? dropoffData?.cashierName || "KASIR-01"
    : cashoutData?.cashierName || "KASIR-01";

  const clientName = isDropoff
    ? dropoffData?.clientName || "Nasabah"
    : cashoutData?.clientName || "Nasabah";

  const clientAcc = isDropoff
    ? dropoffData?.clientAccountNumber
    : cashoutData?.clientAccountNumber;

  const dateStr = formatDateTime(
    isDropoff ? dropoffData?.completedAt : cashoutData?.completedAt
  );

  return (
    <div
      id="thermal-receipt-print-area"
      className="thermal-receipt-container font-mono text-[11px] leading-[1.3] text-black bg-white p-3 w-full max-w-[340px] mx-auto select-text"
      style={{
        fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
      }}
    >
      {/* ---------------------------------------------------- */}
      {/* HEADER ALA INDOMARET */}
      {/* ---------------------------------------------------- */}
      <div className="flex justify-between items-start mb-1 text-[10px] leading-tight">
        <div>
          <div className="font-bold tracking-tight">PT. BANK SAMPAH UANGINKUY</div>
          <div className="uppercase">{branchAddress}</div>
          <div>{npwp}</div>
        </div>
        {/* Indomaret style boxed logo badge */}
        <div className="border border-black px-1.5 py-0.5 text-center font-bold tracking-tighter text-[9px] uppercase">
          UANGINKUY
        </div>
      </div>

      {/* Unit / Loket Center Title */}
      <div className="text-center font-bold text-[11px] my-1 tracking-wider uppercase">
        {unitName}
      </div>

      {/* Divider */}
      <div className="border-b border-dashed border-black my-1" />

      {/* Timestamp, POS, Cashier */}
      <div className="flex justify-between text-[10px] font-bold">
        <span>{dateStr}</span>
        <span>POS-01</span>
        <span className="uppercase truncate max-w-[120px]">
          {cashier.toUpperCase()}
        </span>
      </div>

      {/* Ref No & Client Info */}
      <div className="flex justify-between text-[10px] mt-0.5">
        <span>REF: #{refNumber}</span>
        <span className="truncate max-w-[140px] text-right font-semibold">
          {clientName.toUpperCase()}
        </span>
      </div>

      {clientAcc && (
        <div className="text-[10px] text-left">
          <span>REK: {clientAcc}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-b border-dashed border-black my-1" />

      {/* ---------------------------------------------------- */}
      {/* ITEMS LIST (DETAIL TRANSAKSI) */}
      {/* ---------------------------------------------------- */}
      {isDropoff && dropoffData && (
        <div className="space-y-1.5 my-1.5">
          {dropoffData.items && dropoffData.items.length > 0 ? (
            dropoffData.items.map((item, idx) => (
              <div key={idx} className="text-[10.5px]">
                <div className="font-bold uppercase truncate">
                  {item.categoryName}
                </div>
                <div className="flex justify-between pl-2">
                  <span>
                    {item.weight.toFixed(2)} kg x {formatNum(item.priceApplied)}
                  </span>
                  <span className="font-bold text-right">
                    {formatNum(item.subtotal)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-[10.5px]">
              <div className="font-bold uppercase">PENIMBANGAN SAMPAH LOKET</div>
              <div className="flex justify-between pl-2">
                <span>{dropoffData.totalWeight.toFixed(2)} kg</span>
                <span className="font-bold text-right">
                  {formatNum(dropoffData.totalAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-b border-dashed border-black my-1" />

          {/* Subtotals & Environmental Metric */}
          <div className="space-y-0.5 text-[10.5px]">
            <div className="flex justify-between">
              <span>TOTAL BERAT</span>
              <span className="font-bold">
                {dropoffData.totalWeight.toFixed(2)} KG
              </span>
            </div>
            <div className="flex justify-between">
              <span>EST. REDUKSI CO2</span>
              <span>~{dropoffData.carbonSaved.toFixed(1)} KG CO2e</span>
            </div>
            <div className="flex justify-between">
              <span>HARGA JUAL TOTAL</span>
              <span className="font-bold">
                {formatNum(dropoffData.totalAmount)}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-dashed border-black my-1" />

          {/* Grand Total & Payment Method */}
          <div className="space-y-0.5 text-[11px] font-bold">
            <div className="flex justify-between text-[12px]">
              <span>TOTAL</span>
              <span>Rp {formatNum(dropoffData.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>METODE</span>
              <span className="uppercase">
                {dropoffData.paymentMethod === "cash"
                  ? "TUNAI LANGSUNG"
                  : "MASUK SALDO"}
              </span>
            </div>

            {dropoffData.paymentMethod === "cash" ? (
              <>
                <div className="flex justify-between text-[10px]">
                  <span>TUNAI</span>
                  <span>{formatNum(dropoffData.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>KEMBALI</span>
                  <span>0</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-[10px]">
                <span>TOPUP SALDO</span>
                <span>+{formatNum(dropoffData.totalAmount)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CASHOUT TRANSAKSI (TARIK TUNAI KASIR) */}
      {/* ---------------------------------------------------- */}
      {!isDropoff && cashoutData && (
        <div className="space-y-1 my-1.5">
          <div className="text-[10.5px]">
            <div className="font-bold uppercase">PENARIKAN TUNAI KASIR</div>
            <div className="flex justify-between pl-2">
              <span>1 TRANSAKSI</span>
              <span className="font-bold">{formatNum(cashoutData.amount)}</span>
            </div>
          </div>

          <div className="text-[10.5px]">
            <div className="font-bold uppercase">BIAYA ADMIN LOKET</div>
            <div className="flex justify-between pl-2">
              <span>GRATIS</span>
              <span className="font-bold">0</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-dashed border-black my-1" />

          <div className="space-y-0.5 text-[11px] font-bold">
            <div className="flex justify-between text-[12px]">
              <span>TOTAL PENARIKAN</span>
              <span>Rp {formatNum(cashoutData.amount)}</span>
            </div>
            <div className="flex justify-between text-[10.5px]">
              <span>TUNAI DISERAHKAN</span>
              <span>Rp {formatNum(cashoutData.amount)}</span>
            </div>

            {cashoutData.remainingBalance !== null &&
              cashoutData.remainingBalance !== undefined && (
                <div className="flex justify-between text-[10.5px] pt-0.5 border-t border-dotted border-black/40">
                  <span>SISA SALDO NASABAH</span>
                  <span>Rp {formatNum(cashoutData.remainingBalance)}</span>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-b border-dashed border-black my-1.5" />

      {/* ---------------------------------------------------- */}
      {/* FOOTER ALA INDOMARET MINIMALIS */}
      {/* ---------------------------------------------------- */}
      <div className="text-center text-[10px] space-y-0.5 my-2">
        <div className="font-bold">TERIMA KASIH</div>
        <div>SIMPAN STRUK SEBAGAI BUKTI SAH</div>
        <div className="text-[9px] pt-1">LAYANAN NASABAH: {contactNumber}</div>
        <div className="text-[9px]">WWW.UANGINKUY.COM</div>
      </div>

      {/* Bottom Barcode / Clean Thermal End Indicator */}
      <div className="text-center text-[9px] tracking-widest text-black/70 mt-1">
        ================================
      </div>
    </div>
  );
};
