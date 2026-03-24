import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { IsString, IsNumber, IsBoolean } from 'class-validator';
import { RedisService } from '../redis/redis.service';

// =============================================================================
// Meridian Backend — Admin Override Controller
// =============================================================================
// POST /admin/override — Lock or unlock a product's price multiplier.
//
//   locked: true  → SET override:{id} + SET dynamic_price:{id}
//   locked: false → DEL override:{id} (ML engine resumes)
// =============================================================================

class OverrideDto {
  @IsString()
  product_id!: string;

  @IsNumber()
  multiplier!: number;

  @IsBoolean()
  locked!: boolean;
}

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly redis: RedisService) {}

  @Post('override')
  @HttpCode(200)
  async override(@Body() dto: OverrideDto) {
    const { product_id, multiplier, locked } = dto;
    const overrideKey = `override:${product_id}`;
    const priceKey = `dynamic_price:${product_id}`;

    if (locked) {
      // 1. Set the override flag so ML engine skips this product
      await this.redis.set(overrideKey, String(multiplier));

      // 2. Force-update the live price — MUST be JSON to match the format
      //    the DynamicPricingInterceptor expects: JSON.parse(raw).multiplier
      await this.redis.set(
        priceKey,
        JSON.stringify({
          product_id,
          multiplier,
          updated_at: new Date().toISOString(),
        }),
      );

      this.logger.log(
        `🔒 [OVERRIDE] ${product_id} LOCKED at ${multiplier.toFixed(4)}×`,
      );

      // 3. Broadcast the override to the price chart (immediate tick)
      await this.redis.publish(
        'meridian_price_updates',
        JSON.stringify({
          product_id,
          multiplier,
          timestamp: new Date().toISOString(),
        }),
      );

      // 4. Broadcast an agent log so the terminal shows the human action
      await this.redis.publish(
        'meridian_agent_logs',
        JSON.stringify({
          step: 'DECISION',
          product_id,
          message: `🔒 HUMAN OVERRIDE: Admin locked ${product_id} at ${multiplier.toFixed(4)}×. ML pricing halted.`,
        }),
      );

      return {
        status: 'locked',
        product_id,
        multiplier,
        message: `${product_id} locked at ${multiplier}×`,
      };
    } else {
      // Unlock — delete the override key, ML engine resumes
      await this.redis.del(overrideKey);

      this.logger.log(`🔓 [OVERRIDE] ${product_id} UNLOCKED — ML pricing resumed`);

      await this.redis.publish(
        'meridian_agent_logs',
        JSON.stringify({
          step: 'DECISION',
          product_id,
          message: `🔓 HUMAN OVERRIDE LIFTED: Admin unlocked ${product_id}. ML pricing resumed.`,
        }),
      );

      return {
        status: 'unlocked',
        product_id,
        message: `${product_id} unlocked — AI pricing resumed`,
      };
    }
  }
}
