import React from 'react';

export default class AuditDashboard extends React.Component {
  state = { entries: [], loading: true };
  async componentDidMount() { await this.refresh(); this.poll = setInterval(() => this.refresh(), 1500); }
  componentWillUnmount() { clearInterval(this.poll); }
  async refresh() { const response = await fetch('/api/audit-entries'); this.setState({ entries: await response.json(), loading: false }); }
  render() { return <main><h1>Continuous Audit</h1>{this.state.loading ? <p>Loading...</p> : <ul>{this.state.entries.map(entry => <li key={entry._id}><strong>{entry.title}</strong> - {entry.status} {entry.riskScore ? `- risk ${entry.riskScore}` : ''}</li>)}</ul>}</main>; }
}
