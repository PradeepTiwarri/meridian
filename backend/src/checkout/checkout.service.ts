import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { QuoteResponseDto } from './dto/checkout.dto';

// =============================================================================
// Meridian Backend — Checkout Service
// =============================================================================
// Fetches base price from Supabase, applies the ML-calculated multiplier,
// and returns a full pricing breakdown.
// =============================================================================

// Fallback in-memory prices if Supabase is unavailable
const FALLBACK_PRICES: Record<string, { name: string; sku: string; basePrice: number }> = {
  prod_001: { name: 'Enterprise API Gateway', sku: 'MRD-APG-001', basePrice: 249_900 },
  prod_002: { name: 'Standard Cloud Storage Node', sku: 'MRD-CSN-002', basePrice: 89_900 },
  prod_003: { name: 'Dedicated GPU Cluster', sku: 'MRD-GPU-003', basePrice: 1_299_900 },
  prod_004: { name: 'Managed Kubernetes Orchestrator', sku: 'MRD-K8S-004', basePrice: 179_900 },
  prod_005: { name: 'Real-Time Analytics Pipeline', sku: 'MRD-RAP-005', basePrice: 349_900 },
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async generateQuote(
    productId: string,
    quantity: number,
    multiplier: number,
    multiplierSource: string,
  ): Promise<QuoteResponseDto> {
    // ─── Fetch product from Supabase (with fallback) ────────
    let name: string;
    let sku: string;
    let basePrice: number;

    try {
      const { data, error } = await this.supabase
        .getClient()
        .from('products')
        .select('name, sku, base_price')
        .eq('id', productId)
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'Product not found');
      }

      name = data.name;
      sku = data.sku;
      basePrice = data.base_price;
    } catch {
      // Fallback to in-memory prices
      const fallback = FALLBACK_PRICES[productId];
      if (!fallback) {
        throw new Error(`Product ${productId} not found`);
      }
      name = fallback.name;
      sku = fallback.sku;
      basePrice = fallback.basePrice;
      this.logger.warn(`Using fallback price for ${productId}`);
    }

    // ─── Calculate dynamic price ────────────────────────────
    const unitFinalPrice = Math.round(basePrice * multiplier);
    const totalBasePrice = basePrice * quantity;
    const totalFinalPrice = unitFinalPrice * quantity;
    const surgeOrSavings = totalFinalPrice - totalBasePrice;

    const adjustmentPercent = ((multiplier - 1) * 100);
    const adjustmentSign = adjustmentPercent >= 0 ? '+' : '';

    // Determine adjustment label
    let adjustmentLabel = 'No adjustment';
    if (multiplier > 1.10) {
      adjustmentLabel = 'High Demand Surge';
    } else if (multiplier > 1.0) {
      adjustmentLabel = 'Demand Adjustment';
    } else if (multiplier < 0.95) {
      adjustmentLabel = 'Competitive Discount';
    } else if (multiplier < 1.0) {
      adjustmentLabel = 'Market Correction';
    }

    const quote: QuoteResponseDto = {
      product_id: productId,
      product_name: name,
      sku,
      quantity,

      base_price: totalBasePrice,
      base_price_display: formatCents(totalBasePrice),

      applied_multiplier: multiplier,
      multiplier_source: multiplierSource,
      adjustment_percent: `${adjustmentSign}${adjustmentPercent.toFixed(1)}%`,
      adjustment_label: adjustmentLabel,

      final_price: totalFinalPrice,
      final_price_display: formatCents(totalFinalPrice),

      savings_or_surge_amount: surgeOrSavings,
      savings_or_surge_display: `${surgeOrSavings >= 0 ? '+' : '-'}${formatCents(Math.abs(surgeOrSavings))}`,
    };

    this.logger.log(
      `📝 Quote: ${name} × ${quantity} | base=${formatCents(totalBasePrice)} ` +
        `→ ${multiplier.toFixed(4)}x → final=${formatCents(totalFinalPrice)} ` +
        `(${quote.adjustment_label})`,
    );

    return quote;
  }
}
