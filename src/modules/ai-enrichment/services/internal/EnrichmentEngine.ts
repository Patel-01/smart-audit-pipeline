import type { AuditEnrichment, AuditEntry } from '../../../audit/domain/AuditEntry.js';

/** Internal boundary for the implementation behind AIService. */
export interface EnrichmentEngine {
  enrich(entry: AuditEntry): Promise<AuditEnrichment>;
}
