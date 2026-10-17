import DefaultAuditMutationPlanner from './internal/DefaultAuditMutationPlanner.js';
import type { AuditUpdatePlan } from './internal/AuditMutationPlanner.js';
import type { NewAuditEntry } from '../domain/AuditEntry.js';
import type { AuditMutationPlanner } from './internal/AuditMutationPlanner.js';

export type { AuditUpdatePlan } from './internal/AuditMutationPlanner.js';

/** Decides whether an audit edit is a note update or needs AI re-evaluation. */
export class AuditMutationPolicy {
  constructor(private readonly planner: AuditMutationPlanner = new DefaultAuditMutationPlanner()) {}

  create(payload: unknown): NewAuditEntry {
    return this.planner.create(payload);
  }

  update(payload: unknown): AuditUpdatePlan {
    return this.planner.update(payload);
  }
}
