import type { AuditCoreChanges, NewAuditEntry } from '../../domain/AuditEntry.js';

export type AuditUpdatePlan =
  | { kind: 'notes'; notes: string }
  | { kind: 'core'; changes: AuditCoreChanges };

export interface AuditMutationPlanner {
  create(payload: unknown): NewAuditEntry;
  update(payload: unknown): AuditUpdatePlan;
}
