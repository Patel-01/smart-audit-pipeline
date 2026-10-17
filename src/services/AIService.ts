import type { AuditEnrichment, AuditEntry } from '../domain/AuditEntry.js';

export default class AIService {
  async enrich(entry: AuditEntry): Promise<AuditEnrichment> {
    // Deterministic local adapter: replace this class to call an AI provider.
    const text = `${entry.title} ${entry.vendor} ${entry.evidenceText}`.toLowerCase();
    const hasRiskLanguage = /(urgent|cash|duplicate|override)/.test(text);
    const riskScore = Math.min(100, Math.round(
      (entry.amount > 10_000 ? 35 : 10) + (hasRiskLanguage ? 45 : 15)
    ));

    const semanticVector = Array.from({ length: 8 }, (_, index) => {
      const character = text.charCodeAt(index % Math.max(1, text.length)) || 32;
      return Number(((character % 97) / 97).toFixed(6));
    });

    return {
      riskScore,
      anomalyFlag: riskScore >= 60,
      summary: `Automated review of ${entry.title} for ${entry.vendor}.`,
      semanticVector,
      aiProcessedAt: new Date()
    };
  }
}
