import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Meridian Backend — Supabase Service
// =============================================================================
// Globally injectable Supabase client.
// Reads SUPABASE_URL and SUPABASE_ANON_KEY from environment variables.
// =============================================================================

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client!: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!url || !key) {
      this.logger.warn(
        '⚠️  SUPABASE_URL or SUPABASE_ANON_KEY not set. ' +
          'Supabase queries will fail until configured.',
      );
      return;
    }

    this.client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('✅ Supabase client initialized');
  }

  /**
   * Returns the Supabase client instance.
   * Throws if environment variables are missing.
   */
  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error(
        'Supabase client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY.',
      );
    }
    return this.client;
  }
}
