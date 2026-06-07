export type DecimalString = string;
export type ISODateTimeString = string;

export interface ErrorResponse {
  error_code: string;
  message: string;
  details?: string[];
}

export const SPACE_STATUSES = ['ACTIVO', 'MANTENIMIENTO'] as const;
export type SpaceStatus = (typeof SPACE_STATUSES)[number];

export const RESERVATION_STATUSES = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const PRICING_RULE_NAMES = [
  'HORA_PICO',
  'FIN_DE_SEMANA',
  'RESERVA_LARGA',
  'ANTICIPACION'
] as const;
export type PricingRuleName = (typeof PRICING_RULE_NAMES)[number];

export const REFUND_TIERS = ['COMPLETO', 'PARCIAL', 'SIN_REEMBOLSO'] as const;
export type RefundTier = (typeof REFUND_TIERS)[number];

export interface Space {
  id: string;
  name: string;
  status: SpaceStatus;
  hourly_rate: DecimalString;
  capacity: number;
}

export interface Reservation {
  id: string;
  space_id: string;
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
  status: ReservationStatus;
  total_price: DecimalString;
  created_at: ISODateTimeString;
  cancelled_at: ISODateTimeString | null;
}

export interface PricingQuote {
  space_id: string;
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
  base_hourly_rate: DecimalString;
  total_price: DecimalString;
  applied_rules: PricingRuleName[];
}

export interface ReservationCancellationQuote {
  reservation_id: string;
  reservation_status: ReservationStatus;
  reservation_start_at: ISODateTimeString;
  total_amount: DecimalString;
  refund_amount: DecimalString;
  refund_rate: DecimalString;
  refund_tier: RefundTier;
  quoted_at: ISODateTimeString;
}

export interface CancelReservationResponse {
  reservation: Reservation;
  refund_amount: DecimalString;
}

export interface OccupancyBySpaceItem {
  space_id: string;
  space_name: string;
  occupied_minutes: DecimalString;
  occupancy_percentage: DecimalString;
  reservations_count: number;
}

export interface OccupancyBySpaceReport {
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
  total_minutes_in_range: DecimalString;
  items: OccupancyBySpaceItem[];
}

export interface RevenueReport {
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
  total_revenue: DecimalString;
}

export interface ReservationsByStatusItem {
  status: ReservationStatus;
  count: number;
}

export interface ReservationsByStatusReport {
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
  total_reservations: number;
  items: ReservationsByStatusItem[];
}

export interface SaveSpaceCommand {
  name: string;
  status: SpaceStatus;
  hourly_rate: DecimalString;
  capacity: number;
}

export interface CreateReservationCommand {
  space_id: string;
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
}

export interface PriceQuoteCommand {
  space_id: string;
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
}

export interface ReportRangeQuery {
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
}

export interface SpaceAvailabilityQuery extends ReportRangeQuery {
  slot_minutes: number;
}

export interface SpaceAvailabilityReservationItem {
  reservation_id: string;
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
  status: ReservationStatus;
  total_price: DecimalString;
  blocks_availability: boolean;
}

export interface SpaceAvailabilitySlotItem {
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
  is_available: boolean;
  overlapping_reservations_count: number;
}

export interface SpaceAvailability {
  space_id: string;
  space_name: string;
  space_status: SpaceStatus;
  start_at: ISODateTimeString;
  end_at: ISODateTimeString;
  slot_minutes: number;
  total_slots: number;
  available_slots: number;
  availability_percentage: DecimalString;
  reservations: SpaceAvailabilityReservationItem[];
  slots: SpaceAvailabilitySlotItem[];
}
