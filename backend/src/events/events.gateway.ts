import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';

// =============================================================================
// Meridian Backend — Admin WebSocket Gateway
// =============================================================================
// Bridges Redis Pub/Sub channels → WebSocket clients.
// Subscribes to:
//   - meridian_telemetry_stream → broadcasts as "live_telemetry"
//   - meridian_agent_logs      → broadcasts as "agent_thought"
//   - meridian_price_updates   → broadcasts as "price_chart_update"
// =============================================================================

@WebSocketGateway({
  namespace: '/admin-stream',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private subscriber!: Redis;
  private readonly logger = new Logger('EventsGateway');

  // ─── In-memory catch-up buffers (max 50 items each) ──────────
  private static readonly MAX_BUFFER = 50;
  private telemetryBuffer: unknown[] = [];
  private thoughtBuffer: unknown[] = [];
  private priceBuffer: unknown[] = [];

  private pushToBuffer(buf: unknown[], item: unknown): void {
    buf.push(item);
    if (buf.length > EventsGateway.MAX_BUFFER) buf.shift();
  }

  constructor(private readonly configService: ConfigService) {}

  // ─── Lifecycle ────────────────────────────────────────────────

  /**
   * afterInit fires AFTER the WebSocket server is fully initialized,
   * so this.server is guaranteed to be populated.
   * We set up the Redis subscriber HERE (not in onModuleInit) to
   * ensure the Socket.IO server is ready to emit.
   */
  afterInit(server: Server): void {
    this.logger.log('🔌 Admin WebSocket Gateway initialized');
    this.logger.log(`   Server instance ready: ${!!server}`);

    // ─── Create Redis subscriber ─────────────────────────────
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      retryStrategy(times: number) {
        return Math.min(times * 200, 2000);
      },
    });

    this.subscriber.on('connect', () => {
      this.logger.log('✅ Redis subscriber connected (admin stream)');
    });

    this.subscriber.on('error', (err: Error) => {
      this.logger.warn(`⚠️  Redis subscriber error: ${err.message}`);
    });

    // ─── Subscribe to channels ───────────────────────────────
    this.subscriber.subscribe(
      'meridian_telemetry_stream',
      'meridian_agent_logs',
      'meridian_price_updates',
      (err, count) => {
        if (err) {
          this.logger.error(`❌ Failed to subscribe: ${err.message}`);
          return;
        }
        this.logger.log(
          `📡 Subscribed to ${count} Redis channel(s) for admin stream`,
        );
      },
    );

    // ─── Bridge Redis → WebSocket ────────────────────────────
    this.subscriber.on('message', (channel: string, message: string) => {
      this.logger.debug(`📨 Redis message on [${channel}]: ${message.slice(0, 80)}...`);

      try {
        const parsed = JSON.parse(message);

        if (channel === 'meridian_telemetry_stream') {
          this.pushToBuffer(this.telemetryBuffer, parsed);
          this.server.emit('live_telemetry', parsed);
        } else if (channel === 'meridian_agent_logs') {
          this.pushToBuffer(this.thoughtBuffer, parsed);
          this.server.emit('agent_thought', parsed);
        } else if (channel === 'meridian_price_updates') {
          this.pushToBuffer(this.priceBuffer, parsed);
          this.server.emit('price_chart_update', parsed);
        }
      } catch {
        // If the message isn't valid JSON, broadcast it raw
        const raw = { raw: message };
        if (channel === 'meridian_telemetry_stream') {
          this.pushToBuffer(this.telemetryBuffer, raw);
          this.server.emit('live_telemetry', raw);
        } else if (channel === 'meridian_agent_logs') {
          this.pushToBuffer(this.thoughtBuffer, raw);
          this.server.emit('agent_thought', raw);
        } else if (channel === 'meridian_price_updates') {
          this.pushToBuffer(this.priceBuffer, raw);
          this.server.emit('price_chart_update', raw);
        }
      }
    });
  }

  handleConnection(client: Socket): void {
    this.logger.log(`📡 Admin client connected: ${client.id}`);

    // Send catch-up history so new clients start with populated charts
    client.emit('history_sync', {
      telemetry: [...this.telemetryBuffer],
      thoughts: [...this.thoughtBuffer],
      prices: [...this.priceBuffer],
    });

    this.logger.debug(
      `📦 Sent history_sync: ${this.telemetryBuffer.length} telemetry, ` +
      `${this.thoughtBuffer.length} thoughts, ${this.priceBuffer.length} prices`,
    );
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`🔌 Admin client disconnected: ${client.id}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.subscriber) {
      await this.subscriber.quit();
      this.logger.log('Redis subscriber disconnected (admin stream)');
    }
  }
}
