import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

// =============================================================================
// Meridian Backend — Redis Module
// =============================================================================
// @Global() makes RedisService available across all modules.
// =============================================================================

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
