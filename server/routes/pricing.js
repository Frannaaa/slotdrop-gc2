import { Router } from 'express';
import { getQuote } from '../services/pricing.js';

export function pricingRouter(db, clock) {
  const router = Router();
  router.get('/quote', async (req, res) => res.json(await getQuote(db, req.query, clock())));
  return router;
}
