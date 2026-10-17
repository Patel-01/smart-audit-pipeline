import mongoose, { Schema, type Types } from 'mongoose';
import type { AuditStatus, RiskLevel } from '../domain/AuditEntry.js';

/** MongoDB's persisted shape follows the assessment's baseline evidence schema. */
export interface AuditMetadataDocument {
  status: AuditStatus;
  riskScore?: number;
  riskLevel?: RiskLevel;
  aiSummary?: string;
  anomalyFlags: string[];
  semanticVector: number[];
  auditorNotes: string;
  aiProcessedAt?: Date;
  coreRevision: number;
  aiError?: string;
}

export interface AuditEntryDocument {
  _id: Types.ObjectId;
  timestamp: Date;
  eventType: string;
  evidenceId: string;
  entityName: string;
  description: string;
  monetaryImpact: number;
  controlId: string;
  actorUserId: string;
  tenantId: Types.ObjectId;
  currency: string;
  aiMetadata: AuditMetadataDocument;
  created: Date;
  updated: Date;
}

const auditMetadataSchema = new Schema<AuditMetadataDocument>({
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  riskScore: Number,
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
  aiSummary: String,
  anomalyFlags: { type: [String], default: [] },
  semanticVector: {
    type: [Number],
    validate: (vector: number[] | undefined) => !vector || vector.length === 8
  },
  auditorNotes: { type: String, default: '' },
  aiProcessedAt: Date,
  coreRevision: { type: Number, default: 0 },
  aiError: String
}, { _id: false });

const auditEntrySchema = new Schema<AuditEntryDocument>({
  timestamp: { type: Date, required: true },
  eventType: { type: String, required: true, trim: true },
  evidenceId: { type: String, required: true },
  entityName: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  monetaryImpact: { type: Number, required: true, min: 0 },
  controlId: { type: String, required: true, trim: true },
  actorUserId: { type: String, required: true },
  tenantId: { type: Schema.Types.ObjectId, required: true, index: true },
  currency: { type: String, default: 'USD', uppercase: true },
  aiMetadata: { type: auditMetadataSchema, default: () => ({}) }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } });

auditEntrySchema.index({ 'aiMetadata.status': 1, created: 1 });

export default mongoose.model<AuditEntryDocument>('AuditEntry', auditEntrySchema);
