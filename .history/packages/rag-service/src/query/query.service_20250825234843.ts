import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OpenRouterEmbeddingProvider } from '@nexus-sync/universal-ai/src/index.js';

@Injectable()
export class QueryService {
  private embedder = new OpenRouterEmbeddingProvider();

  constructor(private readonly prisma: PrismaService) {}

  async search(query: string) {
    const { vector } = await this.embedder.embed(query);
    // Simple cosine similarity in SQL is non-trivial with arrays; for now, naive in-app scoring
    const docs = await this.prisma.document.findMany({ include: { embeddings: true }, take: 50 });
    const scored = docs
      .map((d) => {
        const emb = d.embeddings?.[0]?.vector ?? [];
        const score = cosine(emb, vector);
        return { id: d.id, title: d.title, snippet: d.content.slice(0, 200), score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    return { results: scored };
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

