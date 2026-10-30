import { Router } from 'express';
import { ownerCatalog, ownerMetrics, listBookings } from '../repositories/owner.js';
export function ownerRouter(db, clock) {
  const router = Router();
  router.get('/owner/catalog', async (_req,res)=>res.json(await ownerCatalog(db)));
  router.get('/bookings', async (_req,res)=>res.json(await listBookings(db)));
  router.get('/metrics', async (_req,res)=>res.json(await ownerMetrics(db,clock())));
  return router;
}
