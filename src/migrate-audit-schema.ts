import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import AuditEntryModel from './modules/audit/models/AuditEntryModel.js';

const DEFAULT_TENANT_ID = '64b000000000000000000001';
const tenantId = new Types.ObjectId(process.env.DEFAULT_TENANT_ID ?? DEFAULT_TENANT_ID);
const actorUserId = process.env.DEFAULT_ACTOR_USER_ID ?? 'demo-auditor';
const batchSize = 250;

await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/smart-audit');

try {
  const cursor = AuditEntryModel.collection.find({
    timestamp: { $exists: false },
    title: { $exists: true }
  });
  let operations: Array<Parameters<typeof AuditEntryModel.collection.bulkWrite>[0][number]> = [];
  let migrated = 0;

  for await (const legacy of cursor) {
    const aiMetadata = legacy.aiMetadata as Record<string, unknown> | undefined;
    const set = {
      timestamp: legacy.transactionDate ?? legacy.createdAt ?? new Date(),
      eventType: legacy.title,
      evidenceId: legacy.evidenceId ?? 'EVID-' + randomUUID(),
      entityName: legacy.vendor ?? 'Unknown entity',
      description: legacy.evidenceText ?? '',
      monetaryImpact: legacy.amount ?? 0,
      controlId: legacy.controlId ?? 'UNASSIGNED',
      actorUserId: legacy.actorUserId ?? actorUserId,
      tenantId: legacy.tenantId ?? tenantId,
      currency: legacy.currency ?? 'USD',
      aiMetadata: {
        status: aiMetadata?.status ?? legacy.status ?? 'PENDING',
        auditorNotes: aiMetadata?.auditorNotes ?? legacy.auditorNotes ?? '',
        coreRevision: aiMetadata?.coreRevision ?? legacy.coreRevision ?? 0,
        riskScore: aiMetadata?.riskScore ?? legacy.riskScore,
        riskLevel: aiMetadata?.riskLevel ?? legacy.riskLevel,
        aiSummary: aiMetadata?.aiSummary ?? legacy.summary,
        anomalyFlags: aiMetadata?.anomalyFlags ?? legacy.anomalyFlags ?? [],
        semanticVector: aiMetadata?.semanticVector ?? legacy.semanticVector,
        aiProcessedAt: aiMetadata?.aiProcessedAt ?? legacy.aiProcessedAt,
        aiError: aiMetadata?.aiError ?? legacy.aiError
      }
    };
    operations.push({
      updateOne: {
        filter: { _id: legacy._id, timestamp: { $exists: false } },
        update: { $set: set }
      }
    });

    if (operations.length >= batchSize) {
      const result = await AuditEntryModel.collection.bulkWrite(operations);
      migrated += result.modifiedCount;
      operations = [];
    }
  }

  if (operations.length) {
    const result = await AuditEntryModel.collection.bulkWrite(operations);
    migrated += result.modifiedCount;
  }
  console.log('Backfilled ' + migrated + ' legacy audit record(s). Legacy fields were retained.');
} finally {
  await mongoose.disconnect();
}
