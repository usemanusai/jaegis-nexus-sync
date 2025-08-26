// reflect-metadata is included by NestJS bootstrap
import { Module } from '@nestjs/common';
import { IngestModule } from './ingest/ingest.module.js';
import { QueryModule } from './query/query.module.js';

@Module({
  imports: [IngestModule, QueryModule],
})
export class AppModule {}

