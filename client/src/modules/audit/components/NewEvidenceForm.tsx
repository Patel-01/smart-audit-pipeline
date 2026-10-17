import React from 'react';
import { Formik, type FormikErrors } from 'formik';
import type { NewEntryFormState } from '../types/AuditEntry.js';
import Button from '../../../shared/components/Button.js';

interface NewEvidenceFormProps {
  saving: boolean;
  onSubmit(values: NewEntryFormState): Promise<void>;
}

const emptyForm: NewEntryFormState = {
  title: '',
  vendor: '',
  amount: '',
  evidenceText: ''
};

export default class NewEvidenceForm extends React.Component<NewEvidenceFormProps> {
  private readonly validate = (values: NewEntryFormState): FormikErrors<NewEntryFormState> => {
    const errors: FormikErrors<NewEntryFormState> = {};

    if (!values.title.trim()) errors.title = 'Enter an item title.';
    if (!values.vendor.trim()) errors.vendor = 'Enter a vendor or entity.';
    if (!values.evidenceText.trim()) errors.evidenceText = 'Describe the evidence.';

    const amount = Number(values.amount);
    if (!values.amount || !Number.isFinite(amount) || amount < 0) {
      errors.amount = 'Enter a valid non-negative amount.';
    }

    return errors;
  };

  render(): React.ReactNode {
    const { saving, onSubmit } = this.props;
    return <section className="panel create-panel">
      <div className="panel-heading">
        <div><p className="eyebrow">NEW EVIDENCE</p><h2>Submit an audit item</h2></div>
        <span className="panel-caption">Saved immediately · enriched in background</span>
      </div>
      <Formik<NewEntryFormState>
        initialValues={emptyForm}
        validate={this.validate}
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <form className="entry-form" onSubmit={handleSubmit} noValidate>
            <label>Item title
              <input name="title" value={values.title} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Vendor payment override" aria-invalid={Boolean(touched.title && errors.title)} aria-describedby={touched.title && errors.title ? 'title-error' : undefined} />
              {touched.title && errors.title && <span className="field-error" id="title-error">{errors.title}</span>}
            </label>
            <label>Vendor / entity
              <input name="vendor" value={values.vendor} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Acme Supplies" aria-invalid={Boolean(touched.vendor && errors.vendor)} aria-describedby={touched.vendor && errors.vendor ? 'vendor-error' : undefined} />
              {touched.vendor && errors.vendor && <span className="field-error" id="vendor-error">{errors.vendor}</span>}
            </label>
            <label>Amount (USD)
              <input name="amount" type="number" min="0" step="0.01" value={values.amount} onChange={handleChange} onBlur={handleBlur} placeholder="12500" aria-invalid={Boolean(touched.amount && errors.amount)} aria-describedby={touched.amount && errors.amount ? 'amount-error' : undefined} />
              {touched.amount && errors.amount && <span className="field-error" id="amount-error">{errors.amount}</span>}
            </label>
            <label className="evidence-field">Evidence description
              <input name="evidenceText" value={values.evidenceText} onChange={handleChange} onBlur={handleBlur} placeholder="Describe the transaction or control evidence" aria-invalid={Boolean(touched.evidenceText && errors.evidenceText)} aria-describedby={touched.evidenceText && errors.evidenceText ? 'evidence-error' : undefined} />
              {touched.evidenceText && errors.evidenceText && <span className="field-error" id="evidence-error">{errors.evidenceText}</span>}
            </label>
            <Button variant="primary" type="submit" disabled={saving || isSubmitting}>{saving || isSubmitting ? 'Submitting…' : '＋ Add evidence'}</Button>
          </form>
        )}
      </Formik>
    </section>;
  }
}
