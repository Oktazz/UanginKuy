export const TICKET_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  on_the_way: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-error/10 text-error border-error/20",
};

export const TICKET_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu Penjadwalan",
  scheduled: "Terjadwal",
  on_the_way: "Kurir Menuju Lokasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const TICKET_DETAIL_STATUS_LABEL: Record<string, string> = {
  ...TICKET_STATUS_LABEL,
  completed: "Selesai & Masuk Saldo",
};
