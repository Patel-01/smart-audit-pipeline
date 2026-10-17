import AuditController from '../modules/audit/controllers/AuditController.js';
import AuditRepository from '../modules/audit/repositories/AuditRepository.js';
import AIService from '../modules/ai-enrichment/services/AIService.js';
import AIWorkerService from '../modules/audit/services/AIWorkerService.js';
import { AuditMutationPolicy } from '../modules/audit/services/AuditMutationPolicy.js';
import DeterministicEnrichmentEngine from '../modules/ai-enrichment/services/internal/DeterministicEnrichmentEngine.js';
import DefaultAuditMutationPlanner from '../modules/audit/services/internal/DefaultAuditMutationPlanner.js';
import PendingAuditWorker from '../modules/audit/services/internal/PendingAuditWorker.js';

/** Composition root: creates concrete adapters and wires application services. */
export default class ApplicationContainer {
  readonly auditController: AuditController;
  readonly aiWorkerService: AIWorkerService;

  constructor(workerIntervalMs: number) {
    const repository = new AuditRepository();
    const aiService = new AIService(new DeterministicEnrichmentEngine());
    const workerRuntime = new PendingAuditWorker(repository, aiService, workerIntervalMs);
    const mutationPolicy = new AuditMutationPolicy(new DefaultAuditMutationPlanner());

    this.aiWorkerService = new AIWorkerService(workerRuntime);
    this.auditController = new AuditController(repository, mutationPolicy);
  }

  start(): this {
    this.aiWorkerService.start();
    return this;
  }

  stop(): void {
    this.aiWorkerService.stop();
  }
}
