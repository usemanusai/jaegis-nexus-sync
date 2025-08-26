// reflect-metadata is included by NestJS bootstrap
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { IngestModule } from './ingest/ingest.module';
import { QueryModule } from './query/query.module';
import { ApiKeyGuard } from './auth/api-key.guard';

@Module({
  imports: [IngestModule, QueryModule],
  providers: [{ provide: APP_GUARD, useClass: ApiKeyGuard }],
})
export class AppModule {}

