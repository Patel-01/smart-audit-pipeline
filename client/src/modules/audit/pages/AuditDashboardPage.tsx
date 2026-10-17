import React from 'react';
import AuditApiClient from '../services/AuditApiClient.js';
import type { AuditEntryView, CoreEntryDraft, NewEntryFormState, SimilarAuditEntry } from '../types/AuditEntry.js';
import DashboardHeader from '../components/DashboardHeader.js';
import AuditOverview from '../components/AuditOverview.js';
import NewEvidenceForm from '../components/NewEvidenceForm.js';
import AuditStream from '../components/AuditStream.js';

interface DashboardState {
  entries: AuditEntryView[];
  loading: boolean;
  saving: boolean;
  error?: string;
  noteDrafts: Record<string, string>;
  coreDrafts: Record<string, CoreEntryDraft>;
  savingNotesId?: string;
  savingCoreId?: string;
  similarForId?: string;
  similarLoadingId?: string;
  similarResults: Record<string, SimilarAuditEntry[]>;
  similarErrors: Record<string, string>;
}

/** Page-level coordinator: owns request state and composes focused UI components. */
export default class AuditDashboard extends React.Component<object, DashboardState> {
  state: DashboardState = {
    entries: [], loading: true, saving: false,
    noteDrafts: {}, coreDrafts: {}, similarResults: {}, similarErrors: {}
  };

  private readonly api = new AuditApiClient();
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
      const entries = await this.api.listEntries();
      if (this.mounted) this.setState({ entries, loading: false, error: undefined });
    } catch (error) {
      if (this.mounted) this.setState({ loading: false, error: this.message(error) });
    } finally {
      this.refreshing = false;
    }
  }

  private createEntry = async (form: NewEntryFormState): Promise<void> => {
    this.setState({ saving: true, error: undefined });
    try {
      await this.api.createEntry(form);
      this.setState({ saving: false });
      await this.refresh();
    } catch (error) {
      this.setState({ saving: false, error: this.message(error) });
      throw error;
    }
  };

  private updateNoteDraft = (id: string, value: string): void => {
    this.setState(state => ({ noteDrafts: { ...state.noteDrafts, [id]: value } }));
  };

  private saveNotes = async (entry: AuditEntryView): Promise<void> => {
    const notes = this.state.noteDrafts[entry._id] ?? entry.auditorNotes;
    this.setState({ savingNotesId: entry._id, error: undefined });
    try {
      await this.api.updateNotes(entry._id, notes);
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

  private updateCoreDraft = (entry: AuditEntryView, field: keyof CoreEntryDraft, value: string): void => {
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
      await this.api.updateCore(entry._id, draft.amount, draft.evidenceText);
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
      const results = await this.api.findSimilar(id);
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

  private message(error: unknown): string {
    return error instanceof Error ? error.message : 'Request failed';
  }

  render(): React.ReactNode {
    const { entries, loading, saving, error, noteDrafts, coreDrafts,
      savingNotesId, savingCoreId, similarForId, similarLoadingId,
      similarResults, similarErrors } = this.state;
    return <main className="app-shell">
      <DashboardHeader onRefresh={() => void this.refresh()} />
      <AuditOverview entries={entries} />
      <NewEvidenceForm saving={saving} onSubmit={this.createEntry} />
      {error && <div className="alert" role="alert">{error}</div>}
      <AuditStream
        entries={entries} loading={loading} noteDrafts={noteDrafts} coreDrafts={coreDrafts}
        savingNotesId={savingNotesId} savingCoreId={savingCoreId}
        similarForId={similarForId} similarLoadingId={similarLoadingId}
        similarResults={similarResults} similarErrors={similarErrors}
        onNoteChange={this.updateNoteDraft} onSaveNotes={entry => void this.saveNotes(entry)}
        onCoreChange={this.updateCoreDraft} onRecheckCore={entry => void this.recheckCore(entry)}
        onSearchSimilar={id => void this.searchSimilar(id)}
      />
      <footer className="footer"><span>SmartAudit · Assessment prototype</span><span>Notes bypass AI · Core changes trigger re-analysis</span></footer>
    </main>;
  }
}
