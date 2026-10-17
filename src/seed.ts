import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import AuditEntryModel from './modules/audit/models/AuditEntryModel.js';

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/smart-audit';
await mongoose.connect(mongoUri);

// Add demo records without deleting user or production data.
await AuditEntryModel.insertMany([
  {
    timestamp: new Date(), eventType: 'Duplicate invoice review', evidenceId: `EVID-${randomUUID()}`,
    entityName: 'Acme Supplies', monetaryImpact: 12_500, controlId: 'CTRL-AP-101',
    description: 'Duplicate invoice and urgent manual override.', actorUserId: process.env.DEFAULT_ACTOR_USER_ID ?? 'demo-auditor',
    tenantId: new mongoose.Types.ObjectId(process.env.DEFAULT_TENANT_ID ?? '64b000000000000000000001')
  },
  {
    timestamp: new Date(), eventType: 'Travel expense exception', evidenceId: `EVID-${randomUUID()}`,
    entityName: 'Northwind', monetaryImpact: 1_800, controlId: 'CTRL-TRAVEL-204',
    description: 'Travel receipt missing manager approval.', actorUserId: process.env.DEFAULT_ACTOR_USER_ID ?? 'demo-auditor',
    tenantId: new mongoose.Types.ObjectId(process.env.DEFAULT_TENANT_ID ?? '64b000000000000000000001')
  },
  {
    timestamp: new Date(), eventType: 'Manual payment override', evidenceId: `EVID-${randomUUID()}`,
    entityName: 'Global Procurement Services', monetaryImpact: 85_000, controlId: 'CTRL-FIN-302',
    description: 'Urgent manual approval override bypassed the normal vendor payment control.',
    actorUserId: process.env.DEFAULT_ACTOR_USER_ID ?? 'demo-auditor',
    tenantId: new mongoose.Types.ObjectId(process.env.DEFAULT_TENANT_ID ?? '64b000000000000000000001')
  },
  {
    timestamp: new Date(), eventType: 'Quarterly software renewal', evidenceId: `EVID-${randomUUID()}`,
    entityName: 'Contoso Cloud', monetaryImpact: 7_250, controlId: 'CTRL-PROC-118',
    description: 'Renewal matched the approved contract and purchase order.',
    actorUserId: process.env.DEFAULT_ACTOR_USER_ID ?? 'demo-auditor',
    tenantId: new mongoose.Types.ObjectId(process.env.DEFAULT_TENANT_ID ?? '64b000000000000000000001')
  }
]);

console.log('Added four synthetic audit entries');
await mongoose.disconnect();
