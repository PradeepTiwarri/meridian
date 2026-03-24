import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

// =============================================================================
// Meridian Backend — Supabase Module
// =============================================================================
// @Global() makes SupabaseService available across all modules
// without explicit imports.
// =============================================================================

@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
