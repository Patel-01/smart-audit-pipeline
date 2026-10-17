import React from 'react';
import type { AuditEntryView } from '../types/AuditEntry.js';

interface AuditOverviewProps {
  entries: AuditEntryView[];
}

export default class AuditOverview extends React.Component<AuditOverviewProps> {
  private getHighRiskCount(): number {
    return this.props.entries.filter(entry =>
      entry.riskLevel === 'HIGH' || (entry.riskLevel === undefined && (entry.riskScore ?? 0) >= 70)
    ).length;
  }

  private getInFlightCount(): number {
    return this.props.entries.filter(entry => entry.status === 'PENDING' || entry.status === 'PROCESSING').length;
  }

  render(): React.ReactNode {
    return <section className="metrics" aria-label="Audit overview">
      <article className="metric-card"><span className="metric-label">Total evidence</span><strong>{this.props.entries.length}</strong><span className="metric-note">Tracked audit records</span></article>
      <article className="metric-card"><span className="metric-label">AI processing</span><strong>{this.getInFlightCount()}</strong><span className="metric-note">Pending or in progress</span></article>
      <article className="metric-card"><span className="metric-label">High risk</span><strong className="metric-high">{this.getHighRiskCount()}</strong><span className="metric-note">Requires closer review</span></article>
      <article className="metric-card"><span className="metric-label">Enrichment engine</span><strong className="metric-engine">Deterministic</strong><span className="metric-note">Local assessment mode</span></article>
    </section>;
  }
}
