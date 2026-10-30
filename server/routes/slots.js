import { Router } from 'express';
import { ApiError, integer } from '../lib/validation.js';
import { listSlots } from '../services/discovery.js';
import { findSlot } from '../repositories/slots.js';
import { createOffer, editOffer } from '../services/offers.js';

export function slotRouter(db, clock) {
  const router = Router();
  router.post('/', async (req, res) => res.status(201).json(await createOffer(db, req.body, clock)));
  router.patch('/:id', async (req, res) => res.json(await editOffer(db, integer(req.params.id, 'id'), req.body, clock)));
  router.get('/', async (req, res) => res.json(await listSlots(db, req.query, clock())));
  router.get('/:id', async (req, res) => {
    const result = await findSlot(db, integer(req.params.id, 'id'));
    if (!result) throw new ApiError(404, 'SLOT_NOT_FOUND', 'Session not found.');
    res.json(result);
  });
  return router;
}
