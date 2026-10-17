import type { AuditCoreChanges, NewAuditEntry } from '../../domain/AuditEntry.js';
import type { AuditMutationPlanner, AuditUpdatePlan } from './AuditMutationPlanner.js';

/** Internal request validation and field classification for audit mutations. */
export default class DefaultAuditMutationPlanner implements AuditMutationPlanner {
  private readonly coreFields = [
    'title', 'vendor', 'amount', 'currency', 'transactionDate', 'evidenceText'
  ] as const;

  create(payload: unknown): NewAuditEntry {
    const body = this.object(payload);
    this.onlyAllowed(body, [...this.coreFields, 'auditorNotes']);

    return {
      title: this.nonEmptyString(body.title, 'title'),
      vendor: this.nonEmptyString(body.vendor, 'vendor'),
      amount: this.amount(body.amount),
      currency: body.currency === undefined ? 'USD' : this.nonEmptyString(body.currency, 'currency').toUpperCase(),
      transactionDate: this.date(body.transactionDate),
      evidenceText: this.nonEmptyString(body.evidenceText, 'evidenceText'),
      ...(body.auditorNotes === undefined ? {} : { auditorNotes: this.string(body.auditorNotes, 'auditorNotes') })
    };
  }

  update(payload: unknown): AuditUpdatePlan {
    const body = this.object(payload);
    const keys = Object.keys(body);
    if (keys.length === 0) throw new Error('Update must include at least one editable field');
    this.onlyAllowed(body, [...this.coreFields, 'auditorNotes']);

    if (keys.length === 1 && keys[0] === 'auditorNotes') {
      return { kind: 'notes', notes: this.string(body.auditorNotes, 'auditorNotes') };
    }

    const changes: AuditCoreChanges = {};
    if ('title' in body) changes.title = this.nonEmptyString(body.title, 'title');
    if ('vendor' in body) changes.vendor = this.nonEmptyString(body.vendor, 'vendor');
    if ('amount' in body) changes.amount = this.amount(body.amount);
    if ('currency' in body) changes.currency = this.nonEmptyString(body.currency, 'currency').toUpperCase();
    if ('transactionDate' in body) changes.transactionDate = this.date(body.transactionDate);
    if ('evidenceText' in body) changes.evidenceText = this.nonEmptyString(body.evidenceText, 'evidenceText');
    if ('auditorNotes' in body) changes.auditorNotes = this.string(body.auditorNotes, 'auditorNotes');
    return { kind: 'core', changes };
  }

  private object(value: unknown): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Request body must be an object');
    }
    return value as Record<string, unknown>;
  }

  private onlyAllowed(body: Record<string, unknown>, allowed: readonly string[]): void {
    const unexpected = Object.keys(body).find(key => !allowed.includes(key));
    if (unexpected) throw new Error(`Field is not editable: ${unexpected}`);
  }

  private string(value: unknown, field: string): string {
    if (typeof value !== 'string') throw new Error(`${field} must be a string`);
    return value;
  }

  private nonEmptyString(value: unknown, field: string): string {
    const text = this.string(value, field).trim();
    if (!text) throw new Error(`${field} is required`);
    return text;
  }

  private amount(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error('amount must be a non-negative number');
    }
    return value;
  }

  private date(value: unknown): Date {
    if (typeof value !== 'string' && !(value instanceof Date)) {
      throw new Error('transactionDate must be a date');
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error('transactionDate must be a valid date');
    return date;
  }
}
