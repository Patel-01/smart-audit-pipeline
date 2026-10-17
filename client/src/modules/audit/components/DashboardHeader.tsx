import React from 'react';
import Button from '../../../shared/components/Button.js';

interface DashboardHeaderProps {
  onRefresh(): void;
}

export default class DashboardHeader extends React.Component<DashboardHeaderProps> {
  render(): React.ReactNode {
    return <>
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
        <Button variant="quiet" onClick={this.props.onRefresh}>↻ Refresh stream</Button>
      </section>
    </>;
  }
}
