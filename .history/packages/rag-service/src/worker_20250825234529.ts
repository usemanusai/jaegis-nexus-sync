import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

async function processIngest(job: Job) {
  const { documentId } = job.data as { documentId: string };
  // TODO: generate embedding via universal-ai and store
  // Placeholder: store zero-vector of dim 5
  await prisma.embedding.create({
    data: {
      documentId,
      vector: [0, 0, 0, 0, 0],
      model: 'placeholder',
      dim: 5,
    },
  });
}

new Worker('ingest', processIngest, { connection });

// eslint-disable-next-line no-console
console.log('Ingest worker started');

