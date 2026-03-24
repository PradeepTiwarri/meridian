import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';

// =============================================================================
// Meridian Backend — Telemetry Service
// =============================================================================
// High-throughput telemetry ingestion.
// Publishes events to Redis Pub/Sub channel, NOT to Supabase.
// This prevents database lockups under concurrent load.
// =============================================================================

const TELEMETRY_CHANNEL = 'meridian_telemetry_stream';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Ingest a telemetry event:
   *   1. Stringify the payload
   *   2. Publish to Redis Pub/Sub channel (fire-and-forget)
   *   3. Return immediately — never block the HTTP response
   */
  async ingest(dto: CreateTelemetryDto): Promise<{ published: boolean }> {
    const message = JSON.stringify(dto);

    this.logger.log(
      `📡 [${dto.event_type.toUpperCase()}] session=${dto.session_id.slice(0, 8)}...`,
    );

    // Fire-and-forget: publish to Redis without awaiting in the HTTP path
    // We do await here inside the service, but the controller fires this
    // without blocking the response (see controller implementation)
    const published = await this.redis.publish(TELEMETRY_CHANNEL, message);

    if (!published) {
      // Fallback: log to console so no telemetry is lost during development
      this.logger.warn(
        `Redis unavailable — logging telemetry locally:\n${JSON.stringify(dto, null, 2)}`,
      );
    }

    return { published };
  }
}
