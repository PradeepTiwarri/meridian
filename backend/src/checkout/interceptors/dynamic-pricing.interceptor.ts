import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisService } from '../../redis/redis.service';

// =============================================================================
// Meridian Backend — Dynamic Pricing Interceptor
// =============================================================================
// Intercepts incoming checkout requests. Before the controller runs:
//   1. Extract product_id from the request body
//   2. Read `dynamic_price:{product_id}` from Redis
//   3. Parse the ML-calculated multiplier
//   4. Inject `current_multiplier` into the request for the controller
//
// Graceful degradation: If Redis is down or the key doesn't exist,
// the multiplier defaults to 1.0 (no price change).
// This ensures the checkout process NEVER breaks completely.
// =============================================================================

@Injectable()
export class DynamicPricingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DynamicPricingInterceptor.name);

  constructor(private readonly redis: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const body = request.body;

    const productId = body?.product_id;

    if (!productId) {
      this.logger.warn('No product_id in request body — defaulting multiplier to 1.0');
      request.dynamicPricing = { multiplier: 1.0, source: 'default' };
      return next.handle();
    }

    // ─── Read ML multiplier from Redis ────────────────────────
    let multiplier = 1.0;
    let source = 'default';

    try {
      const key = `dynamic_price:${productId}`;
      const raw = await this.redis.get(key);

      if (raw) {
        const data = JSON.parse(raw);
        multiplier = parseFloat(data.multiplier) || 1.0;
        source = 'ml_predicted';

        this.logger.log(
          `💰 Intercepted ${productId}: multiplier=${multiplier.toFixed(4)} (ML)`,
        );
      } else {
        this.logger.log(
          `💰 No dynamic price for ${productId} — using base price (1.0x)`,
        );
      }
    } catch (err) {
      // Redis timeout, parse error, or connection failure
      // NEVER break checkout — just use base price
      this.logger.warn(
        `⚠️  Redis read failed for ${productId}: ${(err as Error).message}. ` +
          'Defaulting multiplier to 1.0',
      );
    }

    // ─── Inject into request ──────────────────────────────────
    request.dynamicPricing = {
      multiplier,
      source,
    };

    return next.handle();
  }
}
