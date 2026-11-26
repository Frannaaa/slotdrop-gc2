import { Router } from 'express';
import { createHold, getHold, releaseHold } from '../services/holds.js';

export function holdRouter(db, clock) {
  const router = Router();
  router.post('/', async (req, res) => {
    const result = await createHold(db, req.body, clock);
    res.status(result.status).json(result.hold);
  });
  router.get('/:id', async (req, res) => res.json(await getHold(db, req.params.id, clock())));
  router.delete('/:id', async (req, res) => res.json(await releaseHold(db, req.params.id, clock)));
  return router;
}
