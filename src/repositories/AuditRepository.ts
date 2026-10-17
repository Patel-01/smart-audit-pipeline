import AuditEntryModel from '../models/AuditEntry.js';
import type {
  AuditCoreChanges,
  AuditEnrichment,
  AuditEntry,
  NewAuditEntry,
  SimilarAuditEntry
} from '../domain/AuditEntry.js';
import type { AuditStore } from './AuditStore.js';

export default class AuditRepository implements AuditStore {
  async create(input: NewAuditEntry): Promise<AuditEntry> {
    const document = await AuditEntryModel.create(input);
    return document.toObject();
  }

  async list(): Promise<AuditEntry[]> {
    const documents = await AuditEntryModel.find().sort({ createdAt: -1 }).exec();
    return documents.map(document => document.toObject());
  }

  async findById(id: string): Promise<AuditEntry | null> {
    const document = await AuditEntryModel.findById(id).exec();
    return document?.toObject() ?? null;
  }

  async updateNotes(id: string, notes: string): Promise<AuditEntry | null> {
    // Note edits never touch the worker status or core revision.
    const document = await AuditEntryModel.findByIdAndUpdate(
      id,
      { $set: { auditorNotes: notes } },
      { new: true, runValidators: true }
    ).exec();
    return document?.toObject() ?? null;
  }

  async updateCore(id: string, changes: AuditCoreChanges): Promise<AuditEntry | null> {
    // Incrementing the revision invalidates an enrichment already in flight.
    const document = await AuditEntryModel.findByIdAndUpdate(
      id,
      {
        $set: { ...changes, status: 'PENDING' },
        $inc: { coreRevision: 1 },
        $unset: {
          riskScore: 1,
          summary: 1,
          anomalyFlag: 1,
          semanticVector: 1,
          aiProcessedAt: 1,
          aiError: 1
        }
      },
      { new: true, runValidators: true }
    ).exec();
    return document?.toObject() ?? null;
  }

  async claimPending(): Promise<AuditEntry | null> {
    // Atomic claim lets multiple worker instances poll safely.
    const document = await AuditEntryModel.findOneAndUpdate(
      { status: 'PENDING' },
      { $set: { status: 'PROCESSING' } },
      { new: true, sort: { createdAt: 1 } }
    ).exec();
    return document?.toObject() ?? null;
  }

  async updateAI(id: string, revision: number, enrichment: AuditEnrichment): Promise<AuditEntry | null> {
    const document = await AuditEntryModel.findOneAndUpdate(
      this.processingFilter(id, revision),
      { $set: { ...enrichment, status: 'COMPLETED' }, $unset: { aiError: 1 } },
      { new: true, runValidators: true }
    ).exec();
    return document?.toObject() ?? null;
  }

  async fail(id: string, revision: number, error: Error): Promise<AuditEntry | null> {
    const document = await AuditEntryModel.findOneAndUpdate(
      this.processingFilter(id, revision),
      { $set: { status: 'FAILED', aiError: error.message } },
      { new: true }
    ).exec();
    return document?.toObject() ?? null;
  }

  async similar(vector: number[], id: string): Promise<SimilarAuditEntry[]> {
    const candidates = await AuditEntryModel.find({
      _id: { $ne: id },
      status: 'COMPLETED',
      semanticVector: { $exists: true }
    }).exec();

    return candidates
      .map(document => {
        const entry = document.toObject();
        return { ...entry, similarity: this.cosine(vector, entry.semanticVector ?? []) };
      })
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 3);
  }

  private processingFilter(id: string, revision: number) {
    const revisionMatch = revision === 0
      ? { $or: [{ coreRevision: 0 }, { coreRevision: { $exists: false } }] }
      : { coreRevision: revision };
    return { _id: id, status: 'PROCESSING', ...revisionMatch };
  }

  private cosine(left: number[], right: number[]): number {
    if (left.length !== 8 || right.length !== 8) return 0;
    const dot = left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
    const norm = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
    return dot / (norm(left) * norm(right) || 1);
  }
}
