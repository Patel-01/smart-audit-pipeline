import type { NextFunction, Request, Response } from 'express';
import type { AuditStore } from '../repositories/AuditStore.js';
import { AuditMutationPolicy } from '../services/AuditMutationPolicy.js';

export default class AuditController {
  constructor(
    private readonly repository: AuditStore,
    private readonly policy: AuditMutationPolicy
  ) {}

  create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const input = this.policy.create(request.body);
      const entry = await this.repository.create(input);
      response.status(202).json(entry);
    } catch (error) {
      next(error);
    }
  };

  list = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await this.repository.list());
    } catch (error) {
      next(error);
    }
  };

  get = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const entry = await this.repository.findById(this.id(request));
      if (!entry) {
        response.status(404).json({ error: 'Not found' });
        return;
      }
      response.json(entry);
    } catch (error) {
      next(error);
    }
  };

  update = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const plan = this.policy.update(request.body);
      const entry = plan.kind === 'notes'
        ? await this.repository.updateNotes(this.id(request), plan.notes)
        : await this.repository.updateCore(this.id(request), plan.changes);

      if (!entry) {
        response.status(404).json({ error: 'Not found' });
        return;
      }
      response.json(entry);
    } catch (error) {
      next(error);
    }
  };

  similar = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const entry = await this.repository.findById(this.id(request));
      if (!entry) {
        response.status(404).json({ error: 'Not found' });
        return;
      }
      if (entry.status !== 'COMPLETED' || entry.semanticVector?.length !== 8) {
        response.status(409).json({ error: 'Entry has no current AI vector yet' });
        return;
      }
      response.json(await this.repository.similar(entry.semanticVector, String(entry._id)));
    } catch (error) {
      next(error);
    }
  };

  private id(request: Request): string {
    const id = request.params.id;
    if (!id) throw new Error('Audit entry ID is required');
    return id;
  }
}
