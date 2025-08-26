import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { OpenRouterEmbeddingProvider } from './embedding/provider.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();
const embedder = new OpenRouterEmbeddingProvider();

async function processIngest(job: Job) {
  const { documentId } = job.data as { documentId: string };
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return;

  // Generate embedding (falls back to deterministic vector if no API key)
  const { vector, model } = await embedder.embed(doc.content);

  const emb = await prisma.embedding.create({
    data: {
      documentId,
      vector,
      model,
      dim: vector.length,
    },
  });
  // Update pgvector column via raw SQL for the created embedding row
  await prisma.$executeRawUnsafe(
    `UPDATE "Embedding" SET "vectorPg" = $1::vector WHERE id = $2`,
    `[${vector.join(',')}]`,
    emb.id
  );
}

new Worker('ingest', processIngest, { connection });

// eslint-disable-next-line no-console
console.log('Ingest worker started');

