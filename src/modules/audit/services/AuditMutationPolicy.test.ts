import assert from 'node:assert/strict';
import test from 'node:test';
import { AuditMutationPolicy } from './AuditMutationPolicy.js';
import DefaultAuditMutationPlanner from './internal/DefaultAuditMutationPlanner.js';

const policy = new AuditMutationPolicy(new DefaultAuditMutationPlanner());

test('note-only edits bypass the AI queue', () => {
  assert.deepEqual(policy.update({ auditorNotes: 'Reviewed by auditor' }), {
    kind: 'notes',
    notes: 'Reviewed by auditor'
  });
});

test('financial edits are identified as core changes', () => {
  assert.deepEqual(policy.update({ amount: 19_500, auditorNotes: 'Recheck' }), {
    kind: 'core',
    changes: { amount: 19_500, auditorNotes: 'Recheck' }
  });
});

test('clients cannot set worker-owned fields', () => {
  assert.throws(() => policy.update({ status: 'COMPLETED' }), /not editable/);
  assert.throws(() => policy.create({ status: 'COMPLETED' }), /not editable/);
});

test('creation requires valid financial evidence', () => {
  assert.throws(() => policy.update({ amount: -1 }), /non-negative/);
  assert.throws(() => policy.update({ transactionDate: 'bad date' }), /valid date/);

  const input = policy.create({
    title: 'Duplicate invoice',
    vendor: 'Acme Supplies',
    amount: 12_500,
    transactionDate: '2026-09-25',
    evidenceText: 'Possible duplicate.',
    controlId: 'CTRL-FIN-302'
  });
  assert.equal(input.currency, 'USD');
  assert.ok(input.transactionDate instanceof Date);
});
