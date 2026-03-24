import { IsString, IsObject, IsNotEmpty, IsISO8601 } from 'class-validator';

// =============================================================================
// Meridian Backend — Create Telemetry DTO
// =============================================================================
// Strict payload validation matching the frontend's TelemetryPayload envelope.
// class-validator decorators ensure runtime type checking.
// =============================================================================

export class CreateTelemetryDto {
  @IsString()
  @IsNotEmpty()
  event_type: string; // 'page_view' | 'dwell_time_seconds' | 'cart_addition' | 'competitor_price_sim'

  @IsISO8601()
  timestamp: string;

  @IsString()
  @IsNotEmpty()
  session_id: string;

  @IsObject()
  payload: Record<string, any>;
}
