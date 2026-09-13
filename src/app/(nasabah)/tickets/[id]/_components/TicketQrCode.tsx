"use client";

import { QRCodeSVG } from "qrcode.react";

export function TicketQrCode({ value }: { value: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200/80">
      <QRCodeSVG value={value} size={200} level="M" />
    </div>
  );
}
