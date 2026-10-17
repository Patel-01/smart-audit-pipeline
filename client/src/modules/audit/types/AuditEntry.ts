export type AuditStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AuditEntryView {
  _id: string;
  title: string;
  vendor: string;
  amount: number;
  currency: string;
  transactionDate: string;
  evidenceText: string;
  controlId: string;
  auditorNotes: string;
  status: AuditStatus;
  riskScore?: number;
  riskLevel?: RiskLevel;
  summary?: string;
  anomalyFlags?: string[];
}

export interface SimilarAuditEntry extends AuditEntryView {
  similarity: number;
}

export interface NewEntryFormState {
  title: string;
  vendor: string;
  amount: string;
  evidenceText: string;
  controlId: string;
}

export interface CoreEntryDraft {
  amount: string;
  evidenceText: string;
  controlId: string;
}
