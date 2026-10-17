import type { AuditStore } from '../repositories/AuditStore.js';
import AIService from './AIService.js';

export default class AIWorkerService {
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    private readonly repository: AuditStore,
    private readonly aiService: AIService,
    private readonly intervalMs = 1000
  ) {}

  start(): this {
    if (!this.timer) {
      this.timer = setInterval(() => {
        void this.processOne().catch(error => console.error('AI worker poll failed', error));
      }, this.intervalMs);
    }
    return this;
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
        // A core edit during enrichment changes the revision, so this write
        // cannot overwrite newer evidence. The updated record stays PENDING.
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
