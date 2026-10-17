import AuditController from '../modules/audit/controllers/AuditController.js';
import AuditRepository from '../modules/audit/repositories/AuditRepository.js';
import AIService from '../modules/ai-enrichment/services/AIService.js';
import AIWorkerService from '../modules/audit/services/AIWorkerService.js';
import { AuditMutationPolicy } from '../modules/audit/services/AuditMutationPolicy.js';
import DeterministicEnrichmentEngine from '../modules/ai-enrichment/services/internal/DeterministicEnrichmentEngine.js';
import DefaultAuditMutationPlanner from '../modules/audit/services/internal/DefaultAuditMutationPlanner.js';
import PendingAuditWorker from '../modules/audit/services/internal/PendingAuditWorker.js';
import OpenAI from 'openai';
import OpenAIEnrichmentEngine from '../modules/ai-enrichment/services/internal/OpenAIEnrichmentEngine.js';
import FallbackEnrichmentEngine from '../modules/ai-enrichment/services/internal/FallbackEnrichmentEngine.js';

function createEnrichmentEngine() {
  const provider = (process.env.AI_PROVIDER ?? (process.env.MOCK_AI === 'false' ? 'openai' : 'mock')).toLowerCase();
  const deterministic = new DeterministicEnrichmentEngine(Number(process.env.AI_PROCESSING_DELAY_MS ?? 400));
  if (provider === 'mock') return deterministic;
  if (provider !== 'openai') throw new Error('Unsupported AI_PROVIDER. Use "mock" or "openai".');
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai.');
  const openAIEngine = new OpenAIEnrichmentEngine(
    new OpenAI({ apiKey, maxRetries: 2, timeout: 30_000 }),
    process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    Number(process.env.AI_REQUEST_INTERVAL_MS ?? 1000)
  );
  return process.env.AI_FALLBACK_TO_MOCK?.toLowerCase() === 'true'
    ? new FallbackEnrichmentEngine(openAIEngine, deterministic)
    : openAIEngine;
}

/** Composition root: creates concrete adapters and wires application services. */
export default class ApplicationContainer {
  readonly auditController: AuditController;
  readonly aiWorkerService: AIWorkerService;

  constructor(workerIntervalMs: number) {
    const repository = new AuditRepository();
    const aiService = new AIService(createEnrichmentEngine());
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
