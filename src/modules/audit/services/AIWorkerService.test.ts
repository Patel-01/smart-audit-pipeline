import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';
import type { AuditCoreChanges, AuditEnrichment, AuditEntry } from '../domain/AuditEntry.js';
import type { AuditStore } from '../ports/AuditStore.js';
import type { AuditEnricher } from '../ports/AuditEnricher.js';
import AIService from '../../ai-enrichment/services/AIService.js';
import AIWorkerService from './AIWorkerService.js';
import DeterministicEnrichmentEngine from '../../ai-enrichment/services/internal/DeterministicEnrichmentEngine.js';
import PendingAuditWorker from './internal/PendingAuditWorker.js';

const createAIService = () => new AIService(new DeterministicEnrichmentEngine(0));
const createWorkerService = (store: AuditStore, aiService: AuditEnricher = createAIService()) =>
  new AIWorkerService(new PendingAuditWorker(store, aiService, 1000));

class InMemoryStore implements AuditStore {
  entry: AuditEntry = {
    _id: new Types.ObjectId(),
    title: 'Duplicate invoice',
    vendor: 'Acme Supplies',
    amount: 12_500,
    currency: 'USD',
    transactionDate: new Date('2026-09-25'),
    evidenceText: 'Urgent duplicate invoice.',
    controlId: 'CTRL-FIN-302',
    auditorNotes: '',
    status: 'PENDING',
    coreRevision: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  async create(): Promise<AuditEntry> { throw new Error('Not used'); }
  async list(): Promise<AuditEntry[]> { return [this.entry]; }
  async findById(): Promise<AuditEntry> { return this.entry; }
  async updateNotes(_id: string, notes: string): Promise<AuditEntry> {
    this.entry.auditorNotes = notes;
    return this.entry;
  }
  async updateCore(_id: string, changes: AuditCoreChanges): Promise<AuditEntry> {
    Object.assign(this.entry, changes);
    this.entry.coreRevision += 1;
    this.entry.status = 'PENDING';
    return this.entry;
  }
  async claimPending(): Promise<AuditEntry | null> {
    if (this.entry.status !== 'PENDING') return null;
    this.entry.status = 'PROCESSING';
    return { ...this.entry };
  }
  async updateAI(_id: string, revision: number, enrichment: AuditEnrichment): Promise<AuditEntry | null> {
    if (this.entry.status !== 'PROCESSING' || this.entry.coreRevision !== revision) return null;
    Object.assign(this.entry, enrichment);
    this.entry.status = 'COMPLETED';
    return this.entry;
  }
  async fail(): Promise<AuditEntry | null> { return null; }
  async similar(): Promise<[]> { return []; }
}

test('worker writes enrichment to a claimed pending record', async () => {
  const store = new InMemoryStore();
  const worker = createWorkerService(store);
  await worker.processOne();

  assert.equal(store.entry.status, 'COMPLETED');
  assert.equal(store.entry.semanticVector?.length, 8);
  assert.ok(store.entry.anomalyFlags?.includes('MONETARY_THRESHOLD_EXCEEDED'));
});

test('an in-flight AI result cannot overwrite a newer financial edit', async () => {
  const store = new InMemoryStore();
  let resolveEnrichment!: (value: AuditEnrichment) => void;
  const delayedAIService: AuditEnricher = {
    enrich: () => new Promise(resolve => { resolveEnrichment = resolve; })
  };
  const worker = createWorkerService(store, delayedAIService);

  const processing = worker.processOne();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(store.entry.status, 'PROCESSING');

  await store.updateCore(String(store.entry._id), { amount: 19_500 });
  resolveEnrichment(await createAIService().enrich(store.entry));
  await processing;

  assert.equal(store.entry.status, 'PENDING');
  assert.equal(store.entry.coreRevision, 1);
  assert.equal(store.entry.riskScore, undefined);
});

test('note-only edits preserve completed status and revision', async () => {
  const store = new InMemoryStore();
  await createWorkerService(store).processOne();
  await store.updateNotes(String(store.entry._id), 'Reviewed');
  assert.equal(store.entry.status, 'COMPLETED');
  assert.equal(store.entry.coreRevision, 0);
});
