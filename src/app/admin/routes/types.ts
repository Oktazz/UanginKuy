export interface Depot {
  latitude: number;
  longitude: number;
}

export interface Courier {
  id: string;
  name: string;
}

export interface RouteTicket {
  id: string;
  courier_id: string | null;
  route_sequence: number | null;
  status: string;
  is_manual_assignment?: boolean;
  user_addresses: {
    recipient_name: string;
    full_address: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface IotDevice {
  id: string;
  assignedCourierId: string | null;
  isOnline: boolean;
  lastPing: string | null;
}

export interface CancelledTicket {
  id: string;
  short_id: string | null;
  updated_at: string | null;
  cancellation_reason?: string | null;
  recipient_name: string;
  full_address: string;
}

export type Feedback = {
  kind: "success" | "error";
  message: string;
};
