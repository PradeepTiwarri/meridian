import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// =============================================================================
// Meridian Backend — Redis Service
// =============================================================================
// Manages the Redis connection for Pub/Sub messaging.
// Used by TelemetryService to publish events to the ML engine pipeline.
// =============================================================================

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisher!: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      lazyConnect: true, // Don't block startup if Redis is unavailable
    });

    this.publisher.on('connect', () => {
      this.logger.log('✅ Redis publisher connected');
    });

    this.publisher.on('error', (err: Error) => {
      this.logger.warn(`⚠️  Redis connection error: ${err.message}`);
    });

    // Attempt connection (non-blocking)
    this.publisher.connect().catch((err: Error) => {
      this.logger.warn(
        `⚠️  Redis not available at ${redisUrl}: ${err.message}. ` +
          'Telemetry will be logged but not published.',
      );
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.publisher) {
      await this.publisher.quit();
      this.logger.log('Redis publisher disconnected');
    }
  }

  /**
   * Publish a message to a Redis Pub/Sub channel.
   * Fire-and-forget — errors are logged but never thrown.
   */
  async publish(channel: string, message: string): Promise<boolean> {
    try {
      if (this.publisher.status !== 'ready') {
        this.logger.warn(`Redis not ready (status: ${this.publisher.status}). Skipping publish.`);
        return false;
      }
      await this.publisher.publish(channel, message);
      return true;
    } catch (err) {
      this.logger.warn(`Failed to publish to ${channel}: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Check if Redis is connected and ready.
   */
  isReady(): boolean {
    return this.publisher?.status === 'ready';
  }

  /**
   * Read a value from Redis by key.
   * Returns null if the key doesn't exist or Redis is unavailable.
   */
  async get(key: string): Promise<string | null> {
    try {
      if (this.publisher.status !== 'ready') {
        return null;
      }
      return await this.publisher.get(key);
    } catch (err) {
      this.logger.warn(`Failed to GET ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Set a key-value pair in Redis.
   */
  async set(key: string, value: string): Promise<boolean> {
    try {
      if (this.publisher.status !== 'ready') {
        return false;
      }
      await this.publisher.set(key, value);
      return true;
    } catch (err) {
      this.logger.warn(`Failed to SET ${key}: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Delete a key from Redis.
   */
  async del(key: string): Promise<boolean> {
    try {
      if (this.publisher.status !== 'ready') {
        return false;
      }
      await this.publisher.del(key);
      return true;
    } catch (err) {
      this.logger.warn(`Failed to DEL ${key}: ${(err as Error).message}`);
      return false;
    }
  }
}
