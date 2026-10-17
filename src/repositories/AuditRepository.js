import AuditEntry from '../models/AuditEntry.js';

export default class AuditRepository {
  create(data) { return AuditEntry.create(data); }
  findById(id) { return AuditEntry.findById(id); }
  list() { return AuditEntry.find().sort({ createdAt: -1 }); }
  claimPending() { return AuditEntry.findOneAndUpdate({ status: 'PENDING' }, { $set: { status: 'PROCESSING' } }, { new: true, sort: { createdAt: 1 } }); }
  updateAI(id, enrichment) { return AuditEntry.findByIdAndUpdate(id, { $set: { ...enrichment, status: 'COMPLETED', aiError: undefined } }, { new: true }); }
  fail(id, error) { return AuditEntry.findByIdAndUpdate(id, { $set: { status: 'FAILED', aiError: error.message } }, { new: true }); }
  updateFields(id, fields) { return AuditEntry.findByIdAndUpdate(id, { $set: fields }, { new: true, runValidators: true }); }
  async similar(vector, id) {
    const entries = await AuditEntry.find({ _id: { $ne: id }, status: 'COMPLETED', semanticVector: { $exists: true } }).lean();
    const magnitude = values => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
    const targetMagnitude = magnitude(vector);
    return entries.map(entry => ({ ...entry, similarity: entry.semanticVector.reduce((sum, value, i) => sum + value * vector[i], 0) / (magnitude(entry.semanticVector) * targetMagnitude || 1) })).sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  }
}
