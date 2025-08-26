export interface EmbeddingProvider {
  embed(input: string): Promise<{ vector: number[]; model: string }>;
}

export class OpenRouterEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly apiKey = process.env.OPENROUTER_API_KEY || '') {}
  async embed(input: string): Promise<{ vector: number[]; model: string }> {
    if (!this.apiKey) {
      const seed = Array.from(input).reduce((a, c) => a + c.charCodeAt(0), 0);
      const dim = 1536;
      const vector = Array.from({ length: dim }, (_, i) => Math.sin(seed * (i + 1)));
      return { vector, model: 'dev-fallback' };
    }
    const res = await fetch('https://api.openrouter.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input,
        model: process.env.OPENROUTER_EMBED_MODEL || 'text-embedding-3-small',
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter embedding failed: ${res.status}`);
    const json: any = await res.json();
    const vector: number[] = json.data?.[0]?.embedding ?? [];
    const model: string = json.model ?? 'unknown';
    return { vector, model };
  }
}

