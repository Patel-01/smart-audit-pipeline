import AuditController from '../controllers/AuditController.js';
import AuditRepository from '../repositories/AuditRepository.js';
import AIService from '../services/AIService.js';
import AIWorkerService from '../services/AIWorkerService.js';
import { AuditMutationPolicy } from '../services/AuditMutationPolicy.js';
import DeterministicEnrichmentEngine from '../services/internal/DeterministicEnrichmentEngine.js';
import DefaultAuditMutationPlanner from '../services/internal/DefaultAuditMutationPlanner.js';
import PendingAuditWorker from '../services/internal/PendingAuditWorker.js';

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
