import {
  Controller,
  Post,
  Body,
  Req,
  Logger,
  UseInterceptors,
  HttpCode,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateQuoteDto, QuoteResponseDto } from './dto/checkout.dto';
import { DynamicPricingInterceptor } from './interceptors/dynamic-pricing.interceptor';

// =============================================================================
// Meridian Backend — Checkout Controller
// =============================================================================
// POST /checkout/quote — Generates a dynamically priced quote.
// The DynamicPricingInterceptor runs BEFORE this controller,
// reading the ML multiplier from Redis and injecting it into the request.
// =============================================================================

@Controller('checkout')
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * POST /checkout/quote
   *
   * Flow:
   *   1. DynamicPricingInterceptor reads `dynamic_price:{product_id}` from Redis
   *   2. Injects `request.dynamicPricing.multiplier` into the request
   *   3. This controller reads the multiplier and passes it to the service
   *   4. Service fetches base price from Supabase, applies multiplier, returns quote
   */
  @Post('quote')
  @HttpCode(200)
  @UseInterceptors(DynamicPricingInterceptor)
  async generateQuote(
    @Body() dto: CreateQuoteDto,
    @Req() request: any,
  ): Promise<QuoteResponseDto> {
    const { multiplier, source } = request.dynamicPricing ?? {
      multiplier: 1.0,
      source: 'default',
    };

    this.logger.log(
      `POST /checkout/quote — product=${dto.product_id} ` +
        `multiplier=${multiplier.toFixed(4)} (${source})`,
    );

    return this.checkoutService.generateQuote(
      dto.product_id,
      dto.quantity ?? 1,
      multiplier,
      source,
    );
  }
}
