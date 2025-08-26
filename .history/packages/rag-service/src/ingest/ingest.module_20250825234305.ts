import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller.js';
import { IngestService } from './ingest.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  controllers: [IngestController],
  providers: [IngestService, PrismaService],
})
export class IngestModule {}

