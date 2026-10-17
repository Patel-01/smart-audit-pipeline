export default class AuditController {
  constructor(repository) { this.repository = repository; }
  create = async (req, res, next) => { try { const entry = await this.repository.create({ ...req.body, status: 'PENDING' }); res.status(202).json(entry); } catch (e) { next(e); } };
  list = async (_req, res, next) => { try { res.json(await this.repository.list()); } catch (e) { next(e); } };
  get = async (req, res, next) => { try { const e = await this.repository.findById(req.params.id); if (!e) return res.status(404).json({ error: 'Not found' }); res.json(e); } catch (e) { next(e); } };
  update = async (req, res, next) => { try { const keys = Object.keys(req.body); const noteOnly = keys.length > 0 && keys.every(k => k === 'auditorNotes'); const fields = noteOnly ? { auditorNotes: req.body.auditorNotes } : { ...req.body, ...(keys.some(k => ['amount','currency','vendor','transactionDate','evidenceText','title'].includes(k)) ? { status: 'PENDING', aiError: undefined } : {}) }; const e = await this.repository.updateFields(req.params.id, fields); if (!e) return res.status(404).json({ error: 'Not found' }); res.json(e); } catch (e) { next(e); } };
  similar = async (req, res, next) => { try { const e = await this.repository.findById(req.params.id); if (!e?.semanticVector) return res.status(409).json({ error: 'Entry has no AI vector yet' }); res.json(await this.repository.similar(e.semanticVector, e._id)); } catch (e) { next(e); } };
}
