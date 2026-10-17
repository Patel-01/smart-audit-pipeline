export default class AIWorkerService {
  constructor(repository, aiService, interval = 1000) { this.repository = repository; this.aiService = aiService; this.interval = interval; this.timer = null; this.running = false; }
  start() { this.timer = setInterval(() => this.processOne(), this.interval); return this; }
  stop() { clearInterval(this.timer); }
  async processOne() { if (this.running) return; this.running = true; try { const entry = await this.repository.claimPending(); if (!entry) return; try { await this.repository.updateAI(entry._id, await this.aiService.enrich(entry)); } catch (e) { await this.repository.fail(entry._id, e); } } finally { this.running = false; } }
}
