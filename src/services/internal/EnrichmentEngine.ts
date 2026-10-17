import type { AuditEnrichment, AuditEntry } from '../../domain/AuditEntry.js';

/** Internal boundary for the implementation behind AIService. */
export interface EnrichmentEngine {
  enrich(entry: AuditEntry): Promise<AuditEnrichment>;
}
