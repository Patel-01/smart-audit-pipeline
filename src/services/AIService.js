export default class AIService {
  async enrich(entry) {
    const text = `${entry.title} ${entry.vendor} ${entry.evidenceText}`.toLowerCase();
    const riskScore = Math.min(100, Math.round((entry.amount > 10000 ? 35 : 10) + (/(urgent|cash|duplicate|override)/.test(text) ? 45 : 15)));
    const vector = Array.from({ length: 8 }, (_, i) => Number((((text.charCodeAt(i % Math.max(1, text.length)) || 32) % 97) / 97).toFixed(6)));
    return { riskScore, anomalyFlag: riskScore >= 60, summary: `Automated review of ${entry.title} for ${entry.vendor}.`, semanticVector: vector, aiProcessedAt: new Date() };
  }
}
