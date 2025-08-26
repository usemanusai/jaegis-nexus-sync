import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const queue = new Queue('ingest', { connection });

@Injectable()
export class IngestService {
  async enqueue(payload: any) {
    const job = await queue.add('ingest', payload, { removeOnComplete: true, removeOnFail: true });
    return job.id as string;
  }
}

