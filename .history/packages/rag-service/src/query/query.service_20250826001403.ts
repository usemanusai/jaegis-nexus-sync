import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OpenRouterEmbeddingProvider } from '@nexus-sync/universal-ai/src/index.js';

@Injectable()
export class QueryService {
  private embedder = new OpenRouterEmbeddingProvider();

  constructor(private readonly prisma: PrismaService) {}

  async search(query: string) {
    const { vector } = await this.embedder.embed(query);

    // DB-side vector search using pgvector ivfflat index
    // Note: Prisma doesn't support vector ops natively; use raw SQL
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

    return {
      results: results.map((r) => ({ id: r.id, title: r.title, snippet: r.content.slice(0, 200), score: r.score })),
    };
  }
}

function vectorToPg(vec: number[]): string {
  // pgvector text input format: '[f1,f2,...]'
  return `[${vec.join(',')}]`;
}

