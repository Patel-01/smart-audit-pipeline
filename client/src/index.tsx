import React from 'react';
import { createRoot } from 'react-dom/client';
import SmartAuditApp from './app/SmartAuditApp.js';

const root = document.getElementById('root');
if (!root) throw new Error('Dashboard root element is missing');
createRoot(root).render(<SmartAuditApp />);
