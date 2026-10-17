import React from 'react';
import AuditDashboardPage from '../modules/audit/pages/AuditDashboardPage.js';
import '../shared/styles.css';

/** Application composition point for cross-feature providers and routing. */
export default class SmartAuditApp extends React.Component {
  render(): React.ReactNode {
    return <AuditDashboardPage />;
  }
}
