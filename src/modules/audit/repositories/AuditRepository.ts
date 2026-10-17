import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import AuditEntryModel from '../models/AuditEntryModel.js';
import type {
  AuditCoreChanges,
  AuditEnrichment,
  AuditEntry,
  NewAuditEntry,
  SimilarAuditEntry
} from '../domain/AuditEntry.js';
import type { AuditStore } from '../ports/AuditStore.js';

const DEFAULT_TENANT_ID = '64b000000000000000000001';

/** Persistence adapter between the API model and the assessment's BSON schema. */
export default class AuditRepository implements AuditStore {
  private readonly tenantId = new Types.ObjectId(process.env.DEFAULT_TENANT_ID ?? DEFAULT_TENANT_ID);
  private readonly actorUserId = process.env.DEFAULT_ACTOR_USER_ID ?? 'demo-auditor';

  async create(input: NewAuditEntry): Promise<AuditEntry> {
    const document = await AuditEntryModel.create({
      timestamp: input.transactionDate,
      eventType: input.title,
      evidenceId: `EVID-${randomUUID()}`,
      entityName: input.vendor,
      description: input.evidenceText,
      monetaryImpact: input.amount,
      controlId: input.controlId,
      actorUserId: this.actorUserId,
      tenantId: this.tenantId,
      currency: input.currency,
      aiMetadata: { status: 'PENDING', auditorNotes: input.auditorNotes ?? '', coreRevision: 0 }
    });
    return this.toDomain(document.toObject());
  }

  async list(): Promise<AuditEntry[]> {
    const documents = await AuditEntryModel.find().sort({ created: -1, createdAt: -1 }).lean().exec();
    return documents.map(document => this.toDomain(document));
  }

  async findById(id: string): Promise<AuditEntry | null> {
    const document = await AuditEntryModel.findById(id).lean().exec();
    return document ? this.toDomain(document) : null;
  }

  async updateNotes(id: string, notes: string): Promise<AuditEntry | null> {
    const document = await AuditEntryModel.findByIdAndUpdate(
      id,
      { $set: { 'aiMetadata.auditorNotes': notes } },
      { new: true, runValidators: true }
    ).lean().exec();
    return document ? this.toDomain(document) : null;
  }

  async updateCore(id: string, changes: AuditCoreChanges): Promise<AuditEntry | null> {
    const coreFieldMap: Record<keyof AuditCoreChanges, string> = {
      title: 'eventType',
      vendor: 'entityName',
      amount: 'monetaryImpact',
      currency: 'currency',
      transactionDate: 'timestamp',
      evidenceText: 'description',
      controlId: 'controlId',
      auditorNotes: 'aiMetadata.auditorNotes'
    };
    const set: Record<string, unknown> = { 'aiMetadata.status': 'PENDING' };
    for (const [field, value] of Object.entries(changes) as [keyof AuditCoreChanges, unknown][]) {
      set[coreFieldMap[field]] = value;
    }

    const document = await AuditEntryModel.findByIdAndUpdate(
      id,
      {
        $set: set,
        $inc: { 'aiMetadata.coreRevision': 1 },
        $unset: {
          'aiMetadata.riskScore': 1,
          'aiMetadata.riskLevel': 1,
          'aiMetadata.aiSummary': 1,
          'aiMetadata.anomalyFlags': 1,
          'aiMetadata.semanticVector': 1,
          'aiMetadata.aiProcessedAt': 1,
          'aiMetadata.aiError': 1
        }
      },
      { new: true, runValidators: true }
    ).lean().exec();
    return document ? this.toDomain(document) : null;
  }

  async claimPending(): Promise<AuditEntry | null> {
    const document = await AuditEntryModel.findOneAndUpdate(
      {
        $or: [
          { 'aiMetadata.status': 'PENDING' },
          { status: 'PENDING', 'aiMetadata.status': { $exists: false } }
        ]
      },
      { $set: { 'aiMetadata.status': 'PROCESSING' } },
      { new: true, sort: { created: 1, createdAt: 1 } }
    ).lean().exec();
    return document ? this.toDomain(document) : null;
  }

  async updateAI(id: string, revision: number, enrichment: AuditEnrichment): Promise<AuditEntry | null> {
    const document = await AuditEntryModel.findOneAndUpdate(
      {
        _id: id,
        'aiMetadata.status': 'PROCESSING',
        $or: [
          { 'aiMetadata.coreRevision': revision },
          ...(revision === 0 ? [{ 'aiMetadata.coreRevision': { $exists: false } }] : [])
        ]
      },
      {
        $set: {
          'aiMetadata.status': 'COMPLETED',
          'aiMetadata.riskScore': enrichment.riskScore,
          'aiMetadata.riskLevel': enrichment.riskLevel,
          'aiMetadata.aiSummary': enrichment.summary,
          'aiMetadata.anomalyFlags': enrichment.anomalyFlags,
          'aiMetadata.semanticVector': enrichment.semanticVector,
          'aiMetadata.aiProcessedAt': enrichment.aiProcessedAt
        },
        $unset: { 'aiMetadata.aiError': 1 }
      },
      { new: true, runValidators: true }
    ).lean().exec();
    return document ? this.toDomain(document) : null;
  }

  async fail(id: string, revision: number, error: Error): Promise<AuditEntry | null> {
    const document = await AuditEntryModel.findOneAndUpdate(
      {
        _id: id,
        'aiMetadata.status': 'PROCESSING',
        $or: [
          { 'aiMetadata.coreRevision': revision },
          ...(revision === 0 ? [{ 'aiMetadata.coreRevision': { $exists: false } }] : [])
        ]
      },
      { $set: { 'aiMetadata.status': 'FAILED', 'aiMetadata.aiError': error.message } },
      { new: true }
    ).lean().exec();
    return document ? this.toDomain(document) : null;
  }

  async similar(vector: number[], id: string): Promise<SimilarAuditEntry[]> {
    const indexName = process.env.VECTOR_SEARCH_INDEX_NAME;
    if (indexName) {
      const matches = await AuditEntryModel.aggregate([
        {
          $vectorSearch: {
            index: indexName,
            path: 'aiMetadata.semanticVector',
            queryVector: vector,
            numCandidates: 100,
            limit: 20,
            filter: { 'aiMetadata.status': 'COMPLETED' }
          }
        },
        { $match: { _id: { $ne: new Types.ObjectId(id) } } },
        { $limit: 3 },
        { $addFields: { similarity: { $meta: 'vectorSearchScore' } } }
      ]).exec();
      return matches.map(match => ({ ...this.toDomain(match), similarity: match.similarity }));
    }

    // Local MongoDB and small demo datasets can run without an Atlas Search index.
    const candidates = await AuditEntryModel.find({
      $and: [
        { _id: { $ne: id } },
        { $or: [{ 'aiMetadata.status': 'COMPLETED' }, { status: 'COMPLETED' }] },
        { $or: [{ 'aiMetadata.semanticVector': { $exists: true } }, { semanticVector: { $exists: true } }] }
      ]
    }).lean().exec();

    return candidates
      .map(document => {
        const entry = this.toDomain(document);
        return { ...entry, similarity: this.cosine(vector, entry.semanticVector ?? []) };
      })
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 3);
  }

  private toDomain(value: unknown): AuditEntry {
    const raw = value as Record<string, any>;
    const metadata = raw.aiMetadata ?? {};
    const isBaselineRecord = raw.timestamp !== undefined && raw.eventType !== undefined;

    return {
      _id: raw._id,
      title: isBaselineRecord ? raw.eventType : raw.title,
      vendor: isBaselineRecord ? raw.entityName : raw.vendor,
      amount: isBaselineRecord ? raw.monetaryImpact : raw.amount,
      currency: raw.currency ?? 'USD',
      transactionDate: isBaselineRecord ? raw.timestamp : raw.transactionDate,
      evidenceText: isBaselineRecord ? raw.description : raw.evidenceText,
      controlId: isBaselineRecord ? raw.controlId : raw.controlId ?? 'UNASSIGNED',
      auditorNotes: metadata.auditorNotes ?? raw.auditorNotes ?? '',
      status: metadata.status ?? raw.status ?? 'PENDING',
      coreRevision: metadata.coreRevision ?? raw.coreRevision ?? 0,
      createdAt: raw.created ?? raw.createdAt,
      updatedAt: raw.updated ?? raw.updatedAt,
      riskScore: metadata.riskScore ?? raw.riskScore,
      riskLevel: metadata.riskLevel ?? raw.riskLevel,
      summary: metadata.aiSummary ?? raw.summary,
      anomalyFlags: metadata.anomalyFlags ?? raw.anomalyFlags ?? [],
      semanticVector: metadata.semanticVector ?? raw.semanticVector,
      aiProcessedAt: metadata.aiProcessedAt ?? raw.aiProcessedAt,
      aiError: metadata.aiError ?? raw.aiError
    };
  }

  private cosine(left: number[], right: number[]): number {
    if (left.length !== 8 || right.length !== 8) return 0;
    const dot = left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
    const norm = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
    return dot / (norm(left) * norm(right) || 1);
  }
}
