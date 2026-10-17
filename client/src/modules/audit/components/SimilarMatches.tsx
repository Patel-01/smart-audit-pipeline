import React from 'react';
import type { SimilarAuditEntry } from '../types/AuditEntry.js';

interface SimilarMatchesProps {
  loading: boolean;
  error?: string;
  results?: SimilarAuditEntry[];
}

export default class SimilarMatches extends React.Component<SimilarMatchesProps> {
  render(): React.ReactNode {
    const { loading, error, results = [] } = this.props;
    return <div className="similar-panel">
      <div className="similar-title">Most similar completed exceptions</div>
      {loading ? <span className="muted">Comparing semantic vectors…</span>
        : error ? <span className="muted">{error}</span>
          : results.length === 0 ? <span className="muted">No comparable historical exceptions yet.</span>
            : <ol>{results.map(match => <li key={match._id}>
              <strong>{match.title}</strong> · {match.vendor} <span>{Math.round(match.similarity * 100)}% match</span>
            </li>)}</ol>}
    </div>;
  }
}
