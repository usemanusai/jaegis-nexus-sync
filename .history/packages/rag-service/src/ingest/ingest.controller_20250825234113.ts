import { Body, Controller, Post } from '@nestjs/common';
import { IngestService } from './ingest.service.js';

export interface IngestDto {
  source: string;
  sourceId?: string;
  title?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post()
  async ingest(@Body() body: IngestDto) {
    const id = await this.ingestService.enqueue(body);
    return { jobId: id };
  }
}

