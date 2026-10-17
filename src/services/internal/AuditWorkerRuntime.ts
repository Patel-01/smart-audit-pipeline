export interface AuditWorkerRuntime {
  start(): void;
  stop(): void;
  processOne(): Promise<void>;
}
