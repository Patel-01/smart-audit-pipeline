import type { AuditEntryView, NewEntryFormState, SimilarAuditEntry } from '../types/AuditEntry.js';

export default class AuditApiClient {
  async listEntries(): Promise<AuditEntryView[]> {
    return this.get<AuditEntryView[]>('/api/audit-entries');
  }

  async createEntry(form: NewEntryFormState): Promise<void> {
    await this.request('/api/audit-entries', 'POST', {
      ...form,
      amount: Number(form.amount),
      currency: 'USD',
      transactionDate: new Date().toISOString(),
      auditorNotes: ''
    });
  }

  async updateNotes(id: string, notes: string): Promise<void> {
    await this.request(`/api/audit-entries/${id}`, 'PUT', { auditorNotes: notes });
  }

  async updateCore(id: string, amount: string, evidenceText: string): Promise<void> {
    await this.request(`/api/audit-entries/${id}`, 'PUT', {
      amount: Number(amount), evidenceText
    });
  }

  async findSimilar(id: string): Promise<SimilarAuditEntry[]> {
    return this.request<SimilarAuditEntry[]>(`/api/audit-entries/${id}/similar`, 'POST');
  }

  private async get<T>(url: string): Promise<T> {
    return this.request<T>(url, 'GET');
  }

  private async request<T = void>(url: string, method: string, body?: unknown): Promise<T> {
    const response = await fetch(url, {
      method,
      ...(body === undefined ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(result.error ?? `Request failed (${response.status})`);
    }
    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  }
}
