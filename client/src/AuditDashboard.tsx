import React from 'react';
import './styles.css';

type AuditStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface AuditEntryView {
  _id: string;
  title: string;
  vendor: string;
  amount: number;
  currency: string;
  transactionDate: string;
  evidenceText: string;
  auditorNotes: string;
  status: AuditStatus;
  riskScore?: number;
  riskLevel?: RiskLevel;
  summary?: string;
  anomalyFlags?: string[];
}

interface SimilarAuditEntry extends AuditEntryView {
  similarity: number;
}

interface DashboardState {
  entries: AuditEntryView[];
  loading: boolean;
  saving: boolean;
  error?: string;
  form: { title: string; vendor: string; amount: string; evidenceText: string };
  noteDrafts: Record<string, string>;
  coreDrafts: Record<string, { amount: string; evidenceText: string }>;
  savingNotesId?: string;
  savingCoreId?: string;
  similarForId?: string;
  similarLoadingId?: string;
  similarResults: Record<string, SimilarAuditEntry[]>;
  similarErrors: Record<string, string>;
}

const initialForm = { title: '', vendor: '', amount: '', evidenceText: '' };

export default class AuditDashboard extends React.Component<object, DashboardState> {
  state: DashboardState = {
    entries: [], loading: true, saving: false, form: initialForm,
    noteDrafts: {}, coreDrafts: {}, similarResults: {}, similarErrors: {}
  };

  private poll?: ReturnType<typeof setInterval>;
  private refreshing = false;
  private mounted = false;

  componentDidMount(): void {
    this.mounted = true;
    void this.refresh();
    this.poll = setInterval(() => void this.refresh(), 2000);
  }

  componentWillUnmount(): void {
    this.mounted = false;
    if (this.poll) clearInterval(this.poll);
  }

  private async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      const response = await fetch('/api/audit-entries');
      if (!response.ok) throw new Error(`Could not load audits (${response.status})`);
      const entries = await response.json() as AuditEntryView[];
      if (this.mounted) this.setState({ entries, loading: false, error: undefined });
    } catch (error) {
      if (this.mounted) this.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load audits'
      });
    } finally {
      this.refreshing = false;
    }
  }

  private updateForm = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = event.currentTarget;
    this.setState(state => ({ form: { ...state.form, [name]: value } }));
  };

  private createEntry = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    this.setState({ saving: true, error: undefined });
    try {
      const response = await fetch('/api/audit-entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.state.form,
          amount: Number(this.state.form.amount),
          currency: 'USD',
          transactionDate: new Date().toISOString(),
          auditorNotes: ''
        })
      });
      if (!response.ok) throw new Error(await this.responseError(response));
      this.setState({ form: initialForm, saving: false });
      await this.refresh();
    } catch (error) {
      this.setState({ saving: false, error: this.message(error) });
    }
  };

  private saveNotes = async (entry: AuditEntryView): Promise<void> => {
    const auditorNotes = this.state.noteDrafts[entry._id] ?? entry.auditorNotes;
    this.setState({ savingNotesId: entry._id, error: undefined });
    try {
      const response = await fetch(`/api/audit-entries/${entry._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditorNotes })
      });
      if (!response.ok) throw new Error(await this.responseError(response));
      this.setState(state => {
        const noteDrafts = { ...state.noteDrafts };
        delete noteDrafts[entry._id];
        return { noteDrafts, savingNotesId: undefined };
      });
      await this.refresh();
    } catch (error) {
      this.setState({ savingNotesId: undefined, error: this.message(error) });
    }
  };

  private updateCoreDraft = (entry: AuditEntryView, field: 'amount' | 'evidenceText', value: string): void => {
    this.setState(state => ({
      coreDrafts: {
        ...state.coreDrafts,
        [entry._id]: {
          amount: state.coreDrafts[entry._id]?.amount ?? String(entry.amount),
          evidenceText: state.coreDrafts[entry._id]?.evidenceText ?? entry.evidenceText,
          [field]: value
        }
      }
    }));
  };

  private recheckCore = async (entry: AuditEntryView): Promise<void> => {
    const draft = this.state.coreDrafts[entry._id] ?? {
      amount: String(entry.amount), evidenceText: entry.evidenceText
    };
    this.setState({ savingCoreId: entry._id, error: undefined });
    try {
      const response = await fetch(`/api/audit-entries/${entry._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(draft.amount), evidenceText: draft.evidenceText })
      });
      if (!response.ok) throw new Error(await this.responseError(response));
      this.setState(state => {
        const coreDrafts = { ...state.coreDrafts };
        delete coreDrafts[entry._id];
        return { savingCoreId: undefined, coreDrafts };
      });
      await this.refresh();
    } catch (error) {
      this.setState({ savingCoreId: undefined, error: this.message(error) });
    }
  };

  private searchSimilar = async (id: string): Promise<void> => {
    this.setState({ similarLoadingId: id, similarForId: id, similarErrors: {} });
    try {
      const response = await fetch(`/api/audit-entries/${id}/similar`, { method: 'POST' });
      if (!response.ok) throw new Error(await this.responseError(response));
      const results = await response.json() as SimilarAuditEntry[];
      this.setState(state => ({
        similarLoadingId: undefined,
        similarResults: { ...state.similarResults, [id]: results }
      }));
    } catch (error) {
      this.setState(state => ({
        similarLoadingId: undefined,
        similarErrors: { ...state.similarErrors, [id]: this.message(error) }
      }));
    }
  };

  private async responseError(response: Response): Promise<string> {
    const body = await response.json().catch(() => ({})) as { error?: string };
    return body.error ?? `Request failed (${response.status})`;
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : 'Request failed';
  }

  private riskLabel(entry: AuditEntryView): RiskLevel | '—' {
    return entry.riskLevel ?? (entry.riskScore === undefined
      ? '—'
      : entry.riskScore >= 70 ? 'HIGH' : entry.riskScore >= 40 ? 'MEDIUM' : 'LOW');
  }

  private formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  render(): React.ReactNode {
    const { entries, loading, saving, error, form, noteDrafts, coreDrafts, savingNotesId,
      savingCoreId, similarForId, similarLoadingId, similarResults, similarErrors } = this.state;
    const highRisk = entries.filter(entry => this.riskLabel(entry) === 'HIGH').length;
    const inFlight = entries.filter(entry => entry.status === 'PENDING' || entry.status === 'PROCESSING').length;

    return (
      <main className="app-shell">
        <header className="topbar">
          <a className="brand" href="#top" aria-label="SmartAudit home"><span className="brand-mark">S</span> SmartAudit</a>
          <span className="environment"><span className="live-dot" /> LIVE AUDIT STREAM</span>
        </header>

        <section className="page-heading" id="top">
          <div>
            <p className="eyebrow">CONTINUOUS CONTROLS MONITORING</p>
            <h1>Audit intelligence</h1>
            <p className="subheading">Evidence in. Risk signals out. Review exceptions as they happen.</p>
          </div>
          <button className="button button-quiet" onClick={() => void this.refresh()}>↻ Refresh stream</button>
        </section>

        <section className="metrics" aria-label="Audit overview">
          <article className="metric-card"><span className="metric-label">Total evidence</span><strong>{entries.length}</strong><span className="metric-note">Tracked audit records</span></article>
          <article className="metric-card"><span className="metric-label">AI processing</span><strong>{inFlight}</strong><span className="metric-note">Pending or in progress</span></article>
          <article className="metric-card"><span className="metric-label">High risk</span><strong className="metric-high">{highRisk}</strong><span className="metric-note">Requires closer review</span></article>
          <article className="metric-card"><span className="metric-label">Enrichment engine</span><strong className="metric-engine">Deterministic</strong><span className="metric-note">Local assessment mode</span></article>
        </section>

        <section className="panel create-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">NEW EVIDENCE</p><h2>Submit an audit item</h2></div>
            <span className="panel-caption">Saved immediately · enriched in background</span>
          </div>
          <form className="entry-form" onSubmit={event => void this.createEntry(event)}>
            <label>Item title<input name="title" value={form.title} onChange={this.updateForm} placeholder="e.g. Vendor payment override" required /></label>
            <label>Vendor / entity<input name="vendor" value={form.vendor} onChange={this.updateForm} placeholder="e.g. Acme Supplies" required /></label>
            <label>Amount (USD)<input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={this.updateForm} placeholder="12500" required /></label>
            <label className="evidence-field">Evidence description<input name="evidenceText" value={form.evidenceText} onChange={this.updateForm} placeholder="Describe the transaction or control evidence" required /></label>
            <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Submitting…' : '＋ Add evidence'}</button>
          </form>
        </section>

        {error && <div className="alert" role="alert">{error}</div>}

        <section className="panel stream-panel">
          <div className="panel-heading stream-heading">
            <div><p className="eyebrow">AUDIT OPERATIONS</p><h2>Live evidence stream</h2></div>
            <span className="panel-caption">Auto-refreshes every 2 seconds</span>
          </div>
          {loading ? <div className="empty-state">Loading audit evidence…</div> : entries.length === 0 ? (
            <div className="empty-state">No audit entries yet. Submit evidence above or run <code>npm run seed</code>.</div>
          ) : (
            <div className="table-scroll"><table>
              <thead><tr><th>Audit evidence</th><th>Amount</th><th>AI risk</th><th>AI executive summary</th><th>Pipeline</th><th>Actions</th></tr></thead>
              <tbody>{entries.map(entry => {
                const risk = this.riskLabel(entry);
                return <React.Fragment key={entry._id}>
                  <tr>
                    <td className="evidence-cell"><strong>{entry.title}</strong><span>{entry.vendor} · {new Date(entry.transactionDate).toLocaleDateString()}</span>
                      {entry.anomalyFlags?.map(flag => <span key={flag} className="flag">{flag.replaceAll('_', ' ')}</span>)}
                    </td>
                    <td className="amount-cell">{this.formatAmount(entry.amount, entry.currency)}</td>
                    <td>{risk === '—' ? <span className="muted">Not scored</span> : <><span className={`risk-badge risk-${risk.toLowerCase()}`}>{risk}</span><span className="score">{entry.riskScore}/100</span></>}</td>
                    <td className="summary-cell">{entry.summary ?? <span className="muted">Waiting for enrichment</span>}</td>
                    <td><span className={`status-badge status-${entry.status.toLowerCase()}`}><i />{entry.status}</span></td>
                    <td><button className="button button-small" disabled={entry.status !== 'COMPLETED' || similarLoadingId === entry._id} onClick={() => void this.searchSimilar(entry._id)}>{similarLoadingId === entry._id ? 'Searching…' : 'Find similar'}</button></td>
                  </tr>
                  <tr className="detail-row"><td colSpan={6}>
                    <div className="detail-grid">
                      <div className="detail-block"><span className="detail-label">Auditor note <span className="fast-track">FAST-TRACK</span></span>
                        <div className="inline-edit"><input aria-label={`Auditor note for ${entry.title}`} value={noteDrafts[entry._id] ?? entry.auditorNotes} placeholder="Add review note…" onChange={event => this.setState(state => ({ noteDrafts: { ...state.noteDrafts, [entry._id]: event.target.value } }))} /><button className="button button-small" disabled={savingNotesId === entry._id} onClick={() => void this.saveNotes(entry)}>{savingNotesId === entry._id ? 'Saving…' : 'Save note'}</button></div>
                      </div>
                      <details className="detail-block core-edit"><summary>Update financial evidence <span>Re-runs AI analysis</span></summary>
                        <div className="core-form"><label>Amount<input aria-label="Amount" type="number" min="0" step="0.01" value={coreDrafts[entry._id]?.amount ?? String(entry.amount)} onChange={event => this.updateCoreDraft(entry, 'amount', event.target.value)} /></label><label>Evidence<input aria-label="Evidence" value={coreDrafts[entry._id]?.evidenceText ?? entry.evidenceText} onChange={event => this.updateCoreDraft(entry, 'evidenceText', event.target.value)} /></label><button className="button button-small" disabled={savingCoreId === entry._id} onClick={() => void this.recheckCore(entry)}>{savingCoreId === entry._id ? 'Re-queuing…' : 'Save & re-analyze'}</button></div>
                      </details>
                    </div>
                    {similarForId === entry._id && <div className="similar-panel"><div className="similar-title">Most similar completed exceptions</div>
                      {similarLoadingId === entry._id ? <span className="muted">Comparing semantic vectors…</span> : similarErrors[entry._id] ? <span className="muted">{similarErrors[entry._id]}</span> : (similarResults[entry._id]?.length ?? 0) === 0 ? <span className="muted">No comparable historical exceptions yet.</span> : <ol>{(similarResults[entry._id] ?? []).map(match => <li key={match._id}><strong>{match.title}</strong> · {match.vendor} <span>{Math.round(match.similarity * 100)}% match</span></li>)}</ol>}
                    </div>}
                  </td></tr>
                </React.Fragment>;
              })}</tbody>
            </table></div>
          )}
        </section>
        <footer className="footer"><span>SmartAudit · Assessment prototype</span><span>Notes bypass AI · Core changes trigger re-analysis</span></footer>
      </main>
    );
  }
}
