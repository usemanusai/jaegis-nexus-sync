import { Injectable } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';

import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const queue = new Queue('ingest', { connection });

@Injectable()
export class IngestService {
  constructor(private readonly prisma: PrismaService, private readonly metrics: MetricsService) {}

  async enqueue(payload: any) {
    const doc = await this.prisma.document.create({
      data: {
        source: payload.source,
        sourceId: payload.sourceId ?? null,
        title: payload.title ?? null,
        content: payload.content,
        metadata: payload.metadata ?? {},
      },
    });

    const job = await queue.add('ingest', { documentId: doc.id }, { removeOnComplete: true, removeOnFail: true });
    try { this.metrics.ingestsQueued.inc(); } catch {}
    return job.id as string;
  }
}

