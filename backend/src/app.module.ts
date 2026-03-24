import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { RedisModule } from './redis/redis.module';
import { ProductsModule } from './products/products.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { CheckoutModule } from './checkout/checkout.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';

// =============================================================================
// Meridian Backend — Root Application Module
// =============================================================================

@Module({
  imports: [
    // Global config — reads .env automatically
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Global services
    SupabaseModule,
    RedisModule,

    // Feature modules
    ProductsModule,
    TelemetryModule,
    CheckoutModule,
    EventsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
