import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto } from './dto/create-telemetry.dto';

// =============================================================================
// Meridian Backend — Telemetry Controller
// =============================================================================
// POST /telemetry — High-throughput ingestion endpoint.
// Returns 200 OK immediately. Redis publishing is fire-and-forget.
// =============================================================================

@Controller('telemetry')
export class TelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(private readonly telemetryService: TelemetryService) {}

  /**
   * POST /telemetry
   * Accepts validated telemetry payloads from the Next.js frontend.
   * Publishes to Redis Pub/Sub and returns immediately.
   */
  @Post()
  @HttpCode(200) // Always 200 — don't use 201 for telemetry ingestion
  async ingest(@Body() dto: CreateTelemetryDto) {
    this.logger.log(`POST /telemetry — ${dto.event_type}`);

    // Fire-and-forget: kick off Redis publish but don't block the response
    // The service handles errors internally and never throws
    this.telemetryService.ingest(dto).catch((err) => {
      this.logger.error(`Telemetry ingestion failed: ${err.message}`);
    });

    // Return immediately — never wait for Redis
    return {
      status: 'received',
      event_type: dto.event_type,
      timestamp: dto.timestamp,
    };
  }
}
