import type {
  AuditCoreChanges,
  AuditEnrichment,
  AuditEntry,
  NewAuditEntry,
  SimilarAuditEntry
} from '../domain/AuditEntry.js';

// Dependency boundary: the controller and worker do not depend on Mongoose.
export interface AuditStore {
  create(input: NewAuditEntry): Promise<AuditEntry>;
  list(): Promise<AuditEntry[]>;
  findById(id: string): Promise<AuditEntry | null>;
  updateNotes(id: string, notes: string): Promise<AuditEntry | null>;
  updateCore(id: string, changes: AuditCoreChanges): Promise<AuditEntry | null>;
  claimPending(): Promise<AuditEntry | null>;
  updateAI(id: string, revision: number, enrichment: AuditEnrichment): Promise<AuditEntry | null>;
  fail(id: string, revision: number, error: Error): Promise<AuditEntry | null>;
  similar(vector: number[], id: string): Promise<SimilarAuditEntry[]>;
}
