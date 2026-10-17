import type { AuditEnrichment, AuditEntry } from '../../../audit/domain/AuditEntry.js';
import type { EnrichmentEngine } from './EnrichmentEngine.js';

/** Uses the local engine only when an explicit fallback is enabled. */
export default class FallbackEnrichmentEngine implements EnrichmentEngine {
  constructor(
    private readonly primary: EnrichmentEngine,
    private readonly fallback: EnrichmentEngine
  ) {}

  async enrich(entry: AuditEntry): Promise<AuditEnrichment> {
    try {
      return await this.primary.enrich(entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown provider error';
      console.error('AI provider failed; using explicitly configured deterministic fallback: ' + message);
      return this.fallback.enrich(entry);
    }
  }
}
