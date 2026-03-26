// =============================================================================
// Meridian Storefront — Type Definitions
// =============================================================================

// ---------------------------------------------------------------------------
// Product Types
// ---------------------------------------------------------------------------

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  basePrice: number; // in USD cents for precision (e.g., 249900 = $2,499.00)
  category: string;
  tier: "Enterprise" | "Standard" | "Premium";
}

// ---------------------------------------------------------------------------
// Telemetry Event Types (Discriminated Union)
// ---------------------------------------------------------------------------

export interface PageViewEvent {
  event_type: "page_view";
  page: string;
}

export interface DwellTimeEvent {
  event_type: "dwell_time_seconds";
  seconds: number;
  page: string;
}

export interface CartAdditionEvent {
  event_type: "cart_addition";
  product_id: string;
  product_sku: string;
  current_price: number;
  action: "add_to_cart" | "generate_quote";
}

export interface CompetitorPriceSimEvent {
  event_type: "competitor_price_sim";
  competitor_name: string;
  competitor_price: number;
  affected_product_id: string;
}

export interface InventoryDropSimEvent {
  event_type: "inventory_drop_sim";
  product_id: string;
  stock_remaining: number;
}

export type TelemetryEvent =
  | PageViewEvent
  | DwellTimeEvent
  | CartAdditionEvent
  | CompetitorPriceSimEvent
  | InventoryDropSimEvent;

// ---------------------------------------------------------------------------
// Telemetry Payload Envelope (strict outgoing JSON structure)
// ---------------------------------------------------------------------------

export interface TelemetryPayload {
  event_type: TelemetryEvent["event_type"];
  session_id: string;
  timestamp: string; // ISO-8601
  payload: Omit<TelemetryEvent, "event_type">;
}

// ---------------------------------------------------------------------------
// Telemetry Context Shape
// ---------------------------------------------------------------------------

export interface TelemetryContextValue {
  sessionId: string;
  trackPageView: (page: string) => void;
  trackDwellTime: (seconds: number, page: string, productId?: string) => void;
  trackCartAddition: (
    productId: string,
    productSku: string,
    currentPrice: number,
    action: "add_to_cart" | "generate_quote"
  ) => void;
  trackCompetitorPriceSim: (
    competitorPrice: number,
    affectedProductId: string
  ) => void;
  trackInventoryDropSim: (
    productId: string,
    stockRemaining: number
  ) => void;
}
