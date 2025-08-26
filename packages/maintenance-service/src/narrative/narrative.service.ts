import { Injectable } from '@nestjs/common'
import { generateText } from '../../universal-ai/src/index'

@Injectable()
export class NarrativeService {
  async advisoryNarrative(input: { name: string, ecosystem: string, id: string, summary: string, url?: string|null }) {
    const prompt = `Create a security-focused, date-aware (today: 2025-08-26) rationale for updating the package below. Include: risk level, exploit likelihood, affected surfaces in a typical web stack (Node/TS, FastAPI, React), safe patch update path, and testing checklist.\n\nPackage: ${input.name} [${input.ecosystem}]\nAdvisory: ${input.id}\nSource: ${input.url||'n/a'}\nSummary: ${input.summary}`
    return await generateText(prompt)
  }
}

