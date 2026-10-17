import type { AuditEnrichment, AuditEntry } from '../../audit/domain/AuditEntry.js';
import type { AuditEnricher } from '../../audit/ports/AuditEnricher.js';
import type { EnrichmentEngine } from './internal/EnrichmentEngine.js';

/** Application-facing service: enrich an audit entry with risk intelligence. */
export default class AIService implements AuditEnricher {
  constructor(
    private readonly engine: EnrichmentEngine
  ) {}

  enrich(entry: AuditEntry): Promise<AuditEnrichment> {
    return this.engine.enrich(entry);
  }
}
