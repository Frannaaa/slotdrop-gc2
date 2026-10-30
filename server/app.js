import express from 'express';
import { fileURLToPath } from 'node:url';
import healthRouter from './routes/health.js';
import { errorHandler } from './middleware/errors.js';
import { postgresDatabase } from './repositories/database.js';
import { slotRouter } from './routes/slots.js';
import { activityRouter } from './routes/activities.js';
import { providerRouter } from './routes/providers.js';
import { pricingRouter } from './routes/pricing.js';
import { ownerRouter } from './routes/owner.js';

export function createApp({ db = postgresDatabase(), clock = () => new Date() } = {}) {
  const app = express();
  app.use(express.json({ limit: '16kb' }));
  app.use('/api/health', healthRouter);
  app.use('/api/activities', activityRouter());
  app.use('/api/slots', slotRouter(db, clock));
  app.use('/api/pricing', pricingRouter(db, clock));
  app.use('/api', ownerRouter(db, clock));
  app.use('/api', providerRouter(db, clock));
  // Keep unavailable API routes in the same JSON error format.
  app.use('/api', (_req, res) => res.status(404).json({
    error: { code: 'ROUTE_NOT_IMPLEMENTED', message: 'This API route is not available yet.' }
}));
app.use(express.static(fileURLToPath(new URL('../public/', import.meta.url))));
app.use(errorHandler);
return app;
}
export default createApp();

