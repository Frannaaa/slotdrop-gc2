import { Router } from 'express';
import { createBooking, findReceipt } from '../services/bookings.js';

// POST / and GET /:id only. GET /api/bookings (owner list) is handled by the owner router.
export function bookingRouter(db, clock) {
  const router = Router();
  router.post('/', async (req, res) => {
    const { status, receipt } = await createBooking(db, req.body, clock);
    res.status(status).json(receipt);
  });
  router.get('/:id', async (req, res) => res.json(await findReceipt(db, req.params.id)));
  return router;
}
