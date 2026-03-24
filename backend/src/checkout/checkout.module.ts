import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { DynamicPricingInterceptor } from './interceptors/dynamic-pricing.interceptor';

// =============================================================================
// Meridian Backend — Checkout Module
// =============================================================================

@Module({
  controllers: [CheckoutController],
  providers: [CheckoutService, DynamicPricingInterceptor],
  exports: [CheckoutService],
})
export class CheckoutModule {}
