import React from 'react';
import type { NewEntryFormState } from '../types/AuditEntry.js';
import Button from '../../../shared/components/Button.js';

interface NewEvidenceFormProps {
  form: NewEntryFormState;
  saving: boolean;
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
  onSubmit(event: React.FormEvent<HTMLFormElement>): void;
}

export default class NewEvidenceForm extends React.Component<NewEvidenceFormProps> {
  render(): React.ReactNode {
    const { form, saving, onChange, onSubmit } = this.props;
    return <section className="panel create-panel">
      <div className="panel-heading">
        <div><p className="eyebrow">NEW EVIDENCE</p><h2>Submit an audit item</h2></div>
        <span className="panel-caption">Saved immediately · enriched in background</span>
      </div>
      <form className="entry-form" onSubmit={onSubmit}>
        <label>Item title<input name="title" value={form.title} onChange={onChange} placeholder="e.g. Vendor payment override" required /></label>
        <label>Vendor / entity<input name="vendor" value={form.vendor} onChange={onChange} placeholder="e.g. Acme Supplies" required /></label>
        <label>Amount (USD)<input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={onChange} placeholder="12500" required /></label>
        <label className="evidence-field">Evidence description<input name="evidenceText" value={form.evidenceText} onChange={onChange} placeholder="Describe the transaction or control evidence" required /></label>
        <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Submitting…' : '＋ Add evidence'}</Button>
      </form>
    </section>;
  }
}
