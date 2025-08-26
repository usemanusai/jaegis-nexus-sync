// reflect-metadata is included by NestJS bootstrap
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { IngestModule } from './ingest/ingest.module';
import { QueryModule } from './query/query.module';
import { DocsModule } from './docs/docs.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';
import { ApiKeyGuard } from './auth/api-key.guard';

@Module({
  imports: [IngestModule, QueryModule, DocsModule, MetricsModule, HealthModule],
  providers: [{ provide: APP_GUARD, useClass: ApiKeyGuard }],
})
export class AppModule {}

