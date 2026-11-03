import { Router } from 'express';

// Render polls this route. In production, a healthy web port is not enough:
// Browse and booking require a reachable persistent database.
export default function healthRouter(db, checkDatabase = false) {
  const router = Router();
  router.get('/', async (_req, res) => {
    if (checkDatabase) {
      let ready = false;
      try {
        const { rows: [tables] } = await db.query(
          "SELECT to_regclass('slots') AS slots, to_regclass('services') AS services, to_regclass('bookings') AS bookings"
        );
        ready = Boolean(tables?.slots && tables.services && tables.bookings);
      } catch {
        // Treat connection failures like missing tables; never expose database details.
      }
      if (!ready)
        return res.status(503).json({ status: 'unavailable', app: 'SlotDrop' });
    }
    return res.json({ status: 'ok', app: 'SlotDrop' });
  });
  return router;
}
