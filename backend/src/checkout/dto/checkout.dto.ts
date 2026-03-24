import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

// =============================================================================
// Meridian Backend — Checkout DTOs
// =============================================================================

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  @IsOptional()
  quantity?: number = 1;
}

export class QuoteResponseDto {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;

  base_price: number;          // cents
  base_price_display: string;  // "$2,499.00"

  applied_multiplier: number;  // e.g., 1.12
  multiplier_source: string;   // "ml_predicted" | "default"
  adjustment_percent: string;  // "+12%" or "-5%"
  adjustment_label: string;    // "Demand Surge" or "Competitive Discount"

  final_price: number;         // cents
  final_price_display: string; // "$2,798.88"

  savings_or_surge_amount: number;        // cents (positive = surge, negative = savings)
  savings_or_surge_display: string;       // "+$299.88" or "-$124.95"
}
