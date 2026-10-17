import React from 'react';
import type { AuditEntryView, CoreEntryDraft, RiskLevel, SimilarAuditEntry } from '../types/AuditEntry.js';
import SimilarMatches from './SimilarMatches.js';
import Button from '../../../shared/components/Button.js';

interface AuditEntryRowProps {
  entry: AuditEntryView;
  noteDraft?: string;
  coreDraft?: CoreEntryDraft;
  savingNote: boolean;
  savingCore: boolean;
  similarExpanded: boolean;
  similarLoading: boolean;
  similarResults?: SimilarAuditEntry[];
  similarError?: string;
  onNoteChange(value: string): void;
  onSaveNotes(): void;
  onCoreChange(field: 'amount' | 'evidenceText', value: string): void;
  onRecheckCore(): void;
  onSearchSimilar(): void;
}

export default class AuditEntryRow extends React.Component<AuditEntryRowProps> {
  private riskLabel(): RiskLevel | '—' {
    const { entry } = this.props;
    return entry.riskLevel ?? (entry.riskScore === undefined
      ? '—'
      : entry.riskScore >= 70 ? 'HIGH' : entry.riskScore >= 40 ? 'MEDIUM' : 'LOW');
  }

  private formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  render(): React.ReactNode {
    const { entry, noteDraft, coreDraft, savingNote, savingCore, similarExpanded,
      similarLoading, similarResults, similarError, onNoteChange, onSaveNotes,
      onCoreChange, onRecheckCore, onSearchSimilar } = this.props;
    const risk = this.riskLabel();
    return <>
      <tr>
        <td className="evidence-cell"><strong>{entry.title}</strong><span>{entry.vendor} · {new Date(entry.transactionDate).toLocaleDateString()}</span>
          {entry.anomalyFlags?.map(flag => <span key={flag} className="flag">{flag.replaceAll('_', ' ')}</span>)}
        </td>
        <td className="amount-cell">{this.formatAmount(entry.amount, entry.currency)}</td>
        <td>{risk === '—' ? <span className="muted">Not scored</span> : <>
          <span className={`risk-badge risk-${risk.toLowerCase()}`}>{risk}</span>
          <span className="score">{entry.riskScore}/100</span>
        </>}</td>
        <td className="summary-cell">{entry.summary ?? <span className="muted">Waiting for enrichment</span>}</td>
        <td><span className={`status-badge status-${entry.status.toLowerCase()}`}><i />{entry.status}</span></td>
        <td><Button size="small" disabled={entry.status !== 'COMPLETED' || similarLoading} onClick={onSearchSimilar}>
          {similarLoading ? 'Searching…' : 'Find similar'}
        </Button></td>
      </tr>
      <tr className="detail-row"><td colSpan={6}>
        <div className="detail-grid">
          <div className="detail-block"><span className="detail-label">Auditor note <span className="fast-track">FAST-TRACK</span></span>
            <div className="inline-edit">
              <input aria-label={`Auditor note for ${entry.title}`} value={noteDraft ?? entry.auditorNotes}
                placeholder="Add review note…" onChange={event => onNoteChange(event.currentTarget.value)} />
              <Button size="small" disabled={savingNote} onClick={onSaveNotes}>{savingNote ? 'Saving…' : 'Save note'}</Button>
            </div>
          </div>
          <details className="detail-block core-edit"><summary>Update financial evidence <span>Re-runs AI analysis</span></summary>
            <div className="core-form">
              <label>Amount<input aria-label="Amount" type="number" min="0" step="0.01"
                value={coreDraft?.amount ?? String(entry.amount)} onChange={event => onCoreChange('amount', event.currentTarget.value)} /></label>
              <label>Evidence<input aria-label="Evidence" value={coreDraft?.evidenceText ?? entry.evidenceText}
                onChange={event => onCoreChange('evidenceText', event.currentTarget.value)} /></label>
              <Button size="small" disabled={savingCore} onClick={onRecheckCore}>{savingCore ? 'Re-queuing…' : 'Save & re-analyze'}</Button>
            </div>
          </details>
        </div>
        {similarExpanded && <SimilarMatches loading={similarLoading} error={similarError} results={similarResults} />}
      </td></tr>
    </>;
  }
}
