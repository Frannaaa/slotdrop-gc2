import express from 'express';
import { fileURLToPath } from 'node:url';
import healthRouter from './routes/health.js';

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use('/api/health', healthRouter);
// Business APIs are implemented in later feature PRs.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Route not implemented in CP0' }));
app.use(express.static(fileURLToPath(new URL('../public/', import.meta.url))));
export default app;
