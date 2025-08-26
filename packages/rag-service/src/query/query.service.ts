import { Injectable } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';

import { PrismaService } from '../prisma/prisma.service.js';
import { OpenRouterEmbeddingProvider } from '../embedding/provider.js';

@Injectable()
export class QueryService {
  private embedder = new OpenRouterEmbeddingProvider();

  constructor(private readonly prisma: PrismaService, private readonly metrics: MetricsService) {}

  async search(query: string) {
    const { vector } = await this.embedder.embed(query);

    const results = await this.prisma.$queryRawUnsafe<{
      id: string;
      title: string | null;
      content: string;
      score: number;
    }[]>(
      `SELECT d.id, d.title, d.content, 1 - (e."vectorPg" <=> $1::vector) AS score
       FROM "Embedding" e
       JOIN "Document" d ON d.id = e."documentId"
       ORDER BY e."vectorPg" <=> $1::vector
       LIMIT 10`,
      vectorToPg(vector)
    );
    try { this.metrics.queriesServed.inc(); } catch {}
    return {
      results: results.map((r) => ({ id: r.id, title: r.title, snippet: r.content.slice(0, 200), score: r.score })),
    };
  }
}

function vectorToPg(vec: number[]): string {
  // pgvector text input format: '[f1,f2,...]'
  return `[${vec.join(',')}]`;
}

