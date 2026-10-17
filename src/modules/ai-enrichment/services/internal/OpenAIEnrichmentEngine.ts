import OpenAI from 'openai';
import type { AuditEnrichment, AuditEntry } from '../../../audit/domain/AuditEntry.js';
import type { EnrichmentEngine } from './EnrichmentEngine.js';

interface EnrichmentResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  anomalyFlags: string[];
}

/** OpenAI-backed risk analysis and compact semantic embeddings. */
export default class OpenAIEnrichmentEngine implements EnrichmentEngine {
  private lastRequestAt = 0;

  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
    private readonly embeddingModel: string,
    private readonly minimumRequestIntervalMs = 1000
  ) {}

  async enrich(entry: AuditEntry): Promise<AuditEnrichment> {
    await this.waitForRequestSlot();
    const evidence = this.formatEvidence(entry);
    const response = await this.client.responses.create({
      model: this.model,
      instructions: [
        'You are an audit risk analyst. Evaluate only the supplied evidence.',
        'Do not invent facts. Return concise, actionable findings.',
        'Risk score is an integer from 0 to 100. Use LOW for 0-39, MEDIUM for 40-69, HIGH for 70-100.',
        'Anomaly flags must be short uppercase identifiers. Return an empty array when no clear anomaly exists.'
      ].join(' '),
      input: evidence,
      text: {
        format: {
          type: 'json_schema',
          name: 'audit_enrichment',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['riskScore', 'riskLevel', 'summary', 'anomalyFlags'],
            properties: {
              riskScore: { type: 'integer', minimum: 0, maximum: 100 },
              riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
              summary: { type: 'string' },
              anomalyFlags: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    });

    const analysis = this.parseAnalysis(response.output_text);
    await this.waitForRequestSlot();
    const embedding = await this.client.embeddings.create({
      model: this.embeddingModel,
      dimensions: 8,
      input: evidence
    });
    const semanticVector = embedding.data[0]?.embedding;
    if (!semanticVector || semanticVector.length !== 8 || semanticVector.some(value => !Number.isFinite(value))) {
      throw new Error('AI provider returned an invalid 8-dimensional semantic vector.');
    }
    return { ...analysis, semanticVector, aiProcessedAt: new Date() };
  }

  private formatEvidence(entry: AuditEntry): string {
    return [
      'Event: ' + entry.title,
      'Entity: ' + entry.vendor,
      'Amount: ' + entry.amount + ' ' + entry.currency,
      'Transaction date: ' + entry.transactionDate.toISOString(),
      'Control: ' + entry.controlId,
      'Evidence: ' + entry.evidenceText
    ].join('\n');
  }

  private parseAnalysis(output: string): EnrichmentResult {
    let result: unknown;
    try {
      result = JSON.parse(output);
    } catch {
      throw new Error('AI provider returned malformed structured enrichment.');
    }
    if (!result || typeof result !== 'object') throw new Error('AI provider returned an empty enrichment result.');
    const candidate = result as Record<string, unknown>;
    const validLevel = candidate.riskLevel === 'LOW' || candidate.riskLevel === 'MEDIUM' || candidate.riskLevel === 'HIGH';
    if (
      !Number.isInteger(candidate.riskScore) || Number(candidate.riskScore) < 0 || Number(candidate.riskScore) > 100 ||
      !validLevel || typeof candidate.summary !== 'string' || !Array.isArray(candidate.anomalyFlags) ||
      !candidate.anomalyFlags.every(flag => typeof flag === 'string')
    ) throw new Error('AI provider returned enrichment fields outside the expected contract.');

    const score = Number(candidate.riskScore);
    const expectedLevel = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    return {
      riskScore: score,
      riskLevel: expectedLevel,
      summary: candidate.summary,
      anomalyFlags: candidate.anomalyFlags as string[]
    };
  }

  private async waitForRequestSlot(): Promise<void> {
    const waitMs = Math.max(0, this.minimumRequestIntervalMs - (Date.now() - this.lastRequestAt));
    if (waitMs > 0) await new Promise(resolve => setTimeout(resolve, waitMs));
    this.lastRequestAt = Date.now();
  }
}
