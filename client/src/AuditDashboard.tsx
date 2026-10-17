import React from 'react';

interface AuditEntryView {
  _id: string;
  title: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  riskScore?: number;
}

interface DashboardState {
  entries: AuditEntryView[];
  loading: boolean;
  error?: string;
}

export default class AuditDashboard extends React.Component<object, DashboardState> {
  state: DashboardState = { entries: [], loading: true };
  private poll?: ReturnType<typeof setInterval>;

  componentDidMount(): void {
    void this.refresh();
    this.poll = setInterval(() => void this.refresh(), 1500);
  }

  componentWillUnmount(): void {
    if (this.poll) clearInterval(this.poll);
  }

  private async refresh(): Promise<void> {
    try {
      const response = await fetch('/api/audit-entries');
      if (!response.ok) throw new Error(`Could not load audits (${response.status})`);
      const entries = await response.json() as AuditEntryView[];
      this.setState({ entries, loading: false, error: undefined });
    } catch (error) {
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load audits'
      });
    }
  }

  render(): React.ReactNode {
    const { entries, loading, error } = this.state;

    return (
      <main>
        <h1>Continuous Audit</h1>
        {loading && <p>Loading...</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && entries.length === 0 && <p>No audit entries yet.</p>}
        <ul>
          {entries.map(entry => (
            <li key={entry._id}>
              <strong>{entry.title}</strong> - {entry.status}
              {entry.riskScore !== undefined && ` - risk ${entry.riskScore}`}
            </li>
          ))}
        </ul>
      </main>
    );
  }
}
