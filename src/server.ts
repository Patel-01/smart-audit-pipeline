import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ApplicationContainer from './application/ApplicationContainer.js';

const app = express();
app.use(cors());
app.use(express.json());

const application = new ApplicationContainer(Number(process.env.AI_WORKER_INTERVAL_MS ?? 1000));
const controller = application.auditController;

app.get('/healthz', (_request, response) => response.json({ status: 'ok' }));
app.post('/api/audit-entries', controller.create);
app.get('/api/audit-entries', controller.list);
app.get('/api/audit-entries/:id/similar', controller.similar);
app.get('/api/audit-entries/:id', controller.get);
app.put('/api/audit-entries/:id', controller.update);

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
app.use(express.static(clientDist));
app.get('*', (_request, response, next) => {
  response.sendFile(path.join(clientDist, 'index.html'), error => {
    if (error) next(error);
  });
});

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  response.status(400).json({ error: error.message });
});

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/smart-audit';
const port = Number(process.env.PORT ?? 4000);

await mongoose.connect(mongoUri);
application.start();
app.listen(port, () => console.log(`API listening on ${port}`));
