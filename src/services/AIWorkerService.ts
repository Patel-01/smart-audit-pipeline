import type { AuditStore } from '../repositories/AuditStore.js';
import AIService from './AIService.js';
import PendingAuditWorker from './internal/PendingAuditWorker.js';

/** Runs background risk enrichment for pending audit entries. */
export default class AIWorkerService {
  private readonly worker: PendingAuditWorker;

  constructor(repository: AuditStore, aiService: AIService, intervalMs = 1000) {
    this.worker = new PendingAuditWorker(repository, aiService, intervalMs);
  }

  start(): this {
    this.worker.start();
    return this;
  }

  stop(): void {
    this.worker.stop();
  }

  processOne(): Promise<void> {
    return this.worker.processOne();
  }
}
