import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';

// =============================================================================
// Admin Module — Human Override API
// =============================================================================

@Module({
  controllers: [AdminController],
})
export class AdminModule {}
