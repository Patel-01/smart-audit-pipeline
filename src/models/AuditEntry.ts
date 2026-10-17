import mongoose, { Schema } from 'mongoose';
import type { AuditEntry } from '../domain/AuditEntry.js';

const auditEntrySchema = new Schema<AuditEntry>({
  title: { type: String, required: true, trim: true },
  vendor: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD', uppercase: true },
  transactionDate: { type: Date, required: true },
  evidenceText: { type: String, required: true },
  auditorNotes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  coreRevision: { type: Number, default: 0 },
  riskScore: Number,
  summary: String,
  anomalyFlag: Boolean,
  semanticVector: {
    type: [Number],
    validate: (vector: number[] | undefined) => !vector || vector.length === 8
  },
  aiProcessedAt: Date,
  aiError: String
}, { timestamps: true });

auditEntrySchema.index({ status: 1, createdAt: 1 });

export default mongoose.model<AuditEntry>('AuditEntry', auditEntrySchema);
