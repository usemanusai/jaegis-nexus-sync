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

function cosine(a: number[], b: number[]) {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

