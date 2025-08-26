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
      body: JSON.stringify({ input, model: process.env.OPENROUTER_EMBED_MODEL || 'text-embedding-3-small' }),
    });
    if (!res.ok) throw new Error(`OpenRouter embedding failed: ${res.status}`);
    const json: any = await res.json();
    const vector: number[] = json.data?.[0]?.embedding ?? [];
    const model: string = json.model ?? 'unknown';
    return { vector, model };
  }
}

export async function generateText(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || ''
  if (!apiKey) {
    // Dev fallback: return prompt trimmed (non-empty) as "summary"
    return `DEV-NARRATIVE\n${prompt.slice(0, 2000)}`
  }
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENROUTER_TEXT_MODEL || 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a maintenance narrative engine. Today is 2025-08-26. Provide concise, security-focused rationales with clear recommendations.' },
        { role: 'user', content: prompt }
      ]
    })
  })
  if (!res.ok) return 'Narrative generation failed.'
  const j: any = await res.json()
  const text = j.choices?.[0]?.message?.content || 'Narrative generation unavailable.'
  return String(text)
}

