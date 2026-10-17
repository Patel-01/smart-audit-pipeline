import 'dotenv/config';
import mongoose from 'mongoose';
import AuditEntryModel from './modules/audit/models/AuditEntryModel.js';

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/smart-audit';
await mongoose.connect(mongoUri);

// Add demo records without deleting user or production data.
await AuditEntryModel.insertMany([
  {
    title: 'Duplicate invoice review',
    vendor: 'Acme Supplies',
    amount: 12_500,
    transactionDate: new Date(),
    evidenceText: 'Duplicate invoice and urgent manual override.'
  },
  {
    title: 'Travel expense exception',
    vendor: 'Northwind',
    amount: 1_800,
    transactionDate: new Date(),
    evidenceText: 'Travel receipt missing manager approval.'
  }
]);

console.log('Added two synthetic audit entries');
await mongoose.disconnect();
