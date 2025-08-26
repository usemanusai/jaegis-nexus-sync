import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { IngestModule } from './ingest/ingest.module.js';

@Module({
  imports: [IngestModule],
})
export class AppModule {}

