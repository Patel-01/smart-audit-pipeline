import type { AuditEnrichment, AuditEntry } from '../domain/AuditEntry.js';
import type { EnrichmentEngine } from './internal/EnrichmentEngine.js';

/** Application-facing service: enrich an audit entry with risk intelligence. */
export default class AIService {
  constructor(
    private readonly engine: EnrichmentEngine
  ) {}

  enrich(entry: AuditEntry): Promise<AuditEnrichment> {
    return this.engine.enrich(entry);
  }
}
