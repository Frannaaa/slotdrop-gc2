import { Router } from 'express';
import { ApiError, integer } from '../lib/validation.js';
import { listSlots } from '../services/discovery.js';
import { findSlot } from '../repositories/slots.js';

export function slotRouter(db, clock) {
  const router = Router();
  router.get('/', async (req, res) => res.json(await listSlots(db, req.query, clock())));
  router.get('/:id', async (req, res) => {
    const result = await findSlot(db, integer(req.params.id, 'id'));
    if (!result) throw new ApiError(404, 'SLOT_NOT_FOUND', 'Session not found.');
    res.json(result);
  });
  return router;
}
