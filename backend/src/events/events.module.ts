import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

// =============================================================================
// Meridian Backend — Events Module
// =============================================================================
// Registers the WebSocket Gateway for real-time admin streaming.
// =============================================================================

@Module({
  providers: [EventsGateway],
})
export class EventsModule {}
