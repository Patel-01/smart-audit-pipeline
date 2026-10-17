import type { AuditEnrichment, AuditEntry } from '../domain/AuditEntry.js';

/** Capability required by audit workflow to enrich evidence with risk signals. */
export interface AuditEnricher {
  enrich(entry: AuditEntry): Promise<AuditEnrichment>;
}
