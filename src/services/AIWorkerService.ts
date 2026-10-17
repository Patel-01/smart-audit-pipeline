import type { AuditStore } from '../repositories/AuditStore.js';
import AIService from './AIService.js';
import type { AuditWorkerRuntime } from './internal/AuditWorkerRuntime.js';

/** Runs background risk enrichment for pending audit entries. */
export default class AIWorkerService {
  constructor(private readonly worker: AuditWorkerRuntime) {}

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
