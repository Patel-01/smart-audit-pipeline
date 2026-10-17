import React from 'react';
import type { AuditEntryView, CoreEntryDraft, SimilarAuditEntry } from '../types/AuditEntry.js';
import AuditEntryRow from './AuditEntryRow.js';

interface AuditStreamProps {
  entries: AuditEntryView[];
  loading: boolean;
  noteDrafts: Record<string, string>;
  coreDrafts: Record<string, CoreEntryDraft>;
  savingNotesId?: string;
  savingCoreId?: string;
  similarForId?: string;
  similarLoadingId?: string;
  similarResults: Record<string, SimilarAuditEntry[]>;
  similarErrors: Record<string, string>;
  onNoteChange(id: string, value: string): void;
  onSaveNotes(entry: AuditEntryView): void;
  onCoreChange(entry: AuditEntryView, field: 'amount' | 'evidenceText', value: string): void;
  onRecheckCore(entry: AuditEntryView): void;
  onSearchSimilar(id: string): void;
}

export default class AuditStream extends React.Component<AuditStreamProps> {
  render(): React.ReactNode {
    const { entries, loading } = this.props;
    return <section className="panel stream-panel">
      <div className="panel-heading stream-heading">
        <div><p className="eyebrow">AUDIT OPERATIONS</p><h2>Live evidence stream</h2></div>
        <span className="panel-caption">Auto-refreshes every 2 seconds</span>
      </div>
      {loading ? <div className="empty-state">Loading audit evidence…</div> : entries.length === 0 ? (
        <div className="empty-state">No audit entries yet. Submit evidence above or run <code>npm run seed</code>.</div>
      ) : <div className="table-scroll"><table>
        <thead><tr><th>Audit evidence</th><th>Amount</th><th>AI risk</th><th>AI executive summary</th><th>Pipeline</th><th>Actions</th></tr></thead>
        <tbody>{entries.map(entry => <AuditEntryRow
          key={entry._id}
          entry={entry}
          noteDraft={this.props.noteDrafts[entry._id]}
          coreDraft={this.props.coreDrafts[entry._id]}
          savingNote={this.props.savingNotesId === entry._id}
          savingCore={this.props.savingCoreId === entry._id}
          similarExpanded={this.props.similarForId === entry._id}
          similarLoading={this.props.similarLoadingId === entry._id}
          similarResults={this.props.similarResults[entry._id]}
          similarError={this.props.similarErrors[entry._id]}
          onNoteChange={value => this.props.onNoteChange(entry._id, value)}
          onSaveNotes={() => this.props.onSaveNotes(entry)}
          onCoreChange={(field, value) => this.props.onCoreChange(entry, field, value)}
          onRecheckCore={() => this.props.onRecheckCore(entry)}
          onSearchSimilar={() => this.props.onSearchSimilar(entry._id)}
        />)}</tbody>
      </table></div>}
    </section>;
  }
}
