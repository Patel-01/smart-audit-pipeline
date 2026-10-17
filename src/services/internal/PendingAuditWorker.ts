import type { AuditStore } from '../../repositories/AuditStore.js';
import AIService from '../AIService.js';
import type { AuditWorkerRuntime } from './AuditWorkerRuntime.js';

/** Polling, concurrency control, and stale-result protection for the worker. */
export default class PendingAuditWorker implements AuditWorkerRuntime {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    private readonly repository: AuditStore,
    private readonly aiService: AIService,
    private readonly intervalMs: number
  ) {}

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.processOne().catch(error => console.error('AI worker poll failed', error));
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async processOne(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const entry = await this.repository.claimPending();
      if (!entry) return;

      const revision = entry.coreRevision ?? 0;
      try {
        const enrichment = await this.aiService.enrich(entry);
        // Core edits advance the revision and invalidate this in-flight result.
        await this.repository.updateAI(String(entry._id), revision, enrichment);
      } catch (error) {
        await this.repository.fail(String(entry._id), revision, this.asError(error));
      }
    } finally {
      this.running = false;
    }
  }

  private asError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }
}
