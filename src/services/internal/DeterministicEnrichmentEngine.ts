import type { AuditEnrichment, AuditEntry } from '../../domain/AuditEntry.js';
import type { EnrichmentEngine } from './EnrichmentEngine.js';

/** Local deterministic implementation used for demos and assessment review. */
export default class DeterministicEnrichmentEngine implements EnrichmentEngine {
  async enrich(entry: AuditEntry): Promise<AuditEnrichment> {
    const evidence = `${entry.title} ${entry.vendor} ${entry.evidenceText}`.toLowerCase();
    const riskScore = this.calculateRiskScore(entry.amount, evidence);

    return {
      riskScore,
      anomalyFlag: riskScore >= 60,
      summary: this.createSummary(entry),
      semanticVector: this.createSemanticVector(evidence),
      aiProcessedAt: new Date()
    };
  }

  private calculateRiskScore(amount: number, evidence: string): number {
    const hasRiskLanguage = /(urgent|cash|duplicate|override)/.test(evidence);
    const amountScore = amount > 10_000 ? 35 : 10;
    const evidenceScore = hasRiskLanguage ? 45 : 15;
    return Math.min(100, Math.round(amountScore + evidenceScore));
  }

  private createSemanticVector(text: string): number[] {
    return Array.from({ length: 8 }, (_, index) => {
      const character = text.charCodeAt(index % Math.max(1, text.length)) || 32;
      return Number(((character % 97) / 97).toFixed(6));
    });
  }

  private createSummary(entry: AuditEntry): string {
    return `Automated review of ${entry.title} for ${entry.vendor}.`;
  }
}
