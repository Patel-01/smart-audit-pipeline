import type { AuditEnrichment, AuditEntry } from '../../../audit/domain/AuditEntry.js';
import type { EnrichmentEngine } from './EnrichmentEngine.js';

/** Local deterministic implementation used for demos and assessment review. */
export default class DeterministicEnrichmentEngine implements EnrichmentEngine {
  constructor(private readonly processingDelayMs = 400) {}

  async enrich(entry: AuditEntry): Promise<AuditEnrichment> {
    const evidence = `${entry.title} ${entry.vendor} ${entry.evidenceText}`.toLowerCase();
    const riskScore = this.calculateRiskScore(entry.amount, evidence);
    const anomalyFlags = this.findAnomalies(entry.amount, evidence);

    if (this.processingDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.processingDelayMs));
    }

    return {
      riskScore,
      riskLevel: this.riskLevel(riskScore),
      anomalyFlags,
      summary: this.createSummary(entry),
      semanticVector: this.createSemanticVector(evidence),
      aiProcessedAt: new Date()
    };
  }

  private riskLevel(score: number): AuditEnrichment['riskLevel'] {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private findAnomalies(amount: number, evidence: string): string[] {
    const flags: string[] = [];
    if (amount > 10_000) flags.push('MONETARY_THRESHOLD_EXCEEDED');
    if (/(duplicate|override|urgent|cash)/.test(evidence)) flags.push('UNUSUAL_DESCRIPTION_PATTERN');
    return flags;
  }

  private calculateRiskScore(amount: number, evidence: string): number {
    const hasRiskLanguage = /(urgent|cash|duplicate|override)/.test(evidence);
    const amountScore = amount > 10_000 ? 35 : 10;
    const evidenceScore = hasRiskLanguage ? 45 : 15;
    return Math.min(100, Math.round(amountScore + evidenceScore + (amount > 50_000 ? 20 : 0)));
  }

  private createSemanticVector(text: string): number[] {
    return Array.from({ length: 8 }, (_, index) => {
      const character = text.charCodeAt(index % Math.max(1, text.length)) || 32;
      return Number(((character % 97) / 97).toFixed(6));
    });
  }

  private createSummary(entry: AuditEntry): string {
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency', currency: entry.currency, maximumFractionDigits: 0
    }).format(entry.amount);
    return `${entry.title} for ${entry.vendor} totals ${amount}. ` +
      'Automated checks assessed the supporting evidence for unusual patterns and approval risk.';
  }
}
