import type { Types } from 'mongoose';

export type AuditStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AuditCoreFields {
  title: string;
  vendor: string;
  amount: number;
  currency: string;
  transactionDate: Date;
  evidenceText: string;
}

export interface AuditEnrichment {
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  anomalyFlags: string[];
  semanticVector: number[];
  aiProcessedAt: Date;
}

export interface AuditEntry extends AuditCoreFields {
  _id: Types.ObjectId;
  auditorNotes: string;
  status: AuditStatus;
  coreRevision: number;
  createdAt: Date;
  updatedAt: Date;
  riskScore?: number;
  riskLevel?: RiskLevel;
  summary?: string;
  anomalyFlags?: string[];
  semanticVector?: number[];
  aiProcessedAt?: Date;
  aiError?: string;
}

export type NewAuditEntry = AuditCoreFields & { auditorNotes?: string };
export type AuditCoreChanges = Partial<AuditCoreFields> & { auditorNotes?: string };
export type SimilarAuditEntry = AuditEntry & { similarity: number };
