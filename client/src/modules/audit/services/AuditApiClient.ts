import type { AuditEntryView, NewEntryFormState, SimilarAuditEntry } from '../types/AuditEntry.js';
import HttpClient from '../../../shared/api/HttpClient.js';

export default class AuditApiClient {
  constructor(private readonly http = new HttpClient()) {}

  async listEntries(): Promise<AuditEntryView[]> {
    return this.http.get<AuditEntryView[]>('/api/audit-entries');
  }

  async createEntry(form: NewEntryFormState): Promise<void> {
    await this.http.post('/api/audit-entries', {
      ...form,
      amount: Number(form.amount),
      currency: 'USD',
      transactionDate: new Date().toISOString(),
      auditorNotes: ''
    });
  }

  async updateNotes(id: string, notes: string): Promise<void> {
    await this.http.put(`/api/audit-entries/${id}`, { auditorNotes: notes });
  }

  async updateCore(id: string, amount: string, evidenceText: string, controlId: string): Promise<void> {
    await this.http.put(`/api/audit-entries/${id}`, {
      amount: Number(amount), evidenceText, controlId
    });
  }

  async findSimilar(id: string): Promise<SimilarAuditEntry[]> {
    return this.http.post<SimilarAuditEntry[]>(`/api/audit-entries/${id}/similar`);
  }
}
