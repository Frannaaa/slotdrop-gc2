import { safeNumber } from '../lib/validation.js';

export function holdStatus(row, now) {
  if (row.status === 'active' && new Date(row.expires_at) <= now) return 'expired';
  return row.status;
}

export function holdResponse(row, slot, now) {
  return {
    id: row.id, slotId: safeNumber(row.slot_id), quantity: safeNumber(row.quantity),
    status: holdStatus(row, now), expiresAt: new Date(row.expires_at).toISOString(),
    serverNow: now.toISOString(), remainingSeats: slot.remainingSeats,
  };
}

export async function findHold(db, id) {
  const { rows } = await db.query('SELECT * FROM seat_holds WHERE id=$1', [id]);
  return rows[0] || null;
}

export async function findHoldByRequestId(db, requestId) {
  const { rows } = await db.query('SELECT * FROM seat_holds WHERE request_id=$1', [requestId]);
  return rows[0] || null;
}

export async function shortenHoldDeadlines(db, slotId, cutoff, now) {
  // Closing sales releases holds. Moving a deadline later never renews them.
  await db.query(`UPDATE seat_holds SET
    status=CASE WHEN $3::timestamptz <= $2 THEN 'released' ELSE status END,
    expires_at=CASE WHEN $3::timestamptz > $2 THEN LEAST(expires_at,$3::timestamptz) ELSE expires_at END
    WHERE slot_id=$1 AND status='active' AND expires_at > $2`, [slotId, now, cutoff]);
}
