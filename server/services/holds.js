// Group assignment: Fran. Hold conversion into a booking is Janelle's handoff.
import { MAX_SEATS } from '../config/business.js';
import { ApiError, integer, invalid, object, safeNumber, uuid } from '../lib/validation.js';
import { findSlot } from '../repositories/slots.js';
import { findHold, findHoldByRequestId, holdResponse, holdStatus } from '../repositories/holds.js';
import { checkBookable } from './pricing.js';

export const HOLD_DURATION_MS = 10 * 60 * 1000;

export function holdRequest(body) {
  object(body, ['requestId', 'slotId', 'quantity']);
  for (const name of ['requestId', 'slotId', 'quantity']) {
    if (body[name] === undefined) invalid('Provide ' + name + '.');
  }
  for (const name of ['slotId', 'quantity']) {
    if (typeof body[name] !== 'number') invalid(name + ' must be a JSON integer.');
  }
  return {
    requestId: uuid(body.requestId, 'requestId'),
    slotId: integer(body.slotId, 'slotId'),
    quantity: integer(body.quantity, 'quantity', 1, MAX_SEATS),
  };
}

async function response(db, row, now) {
  return holdResponse(row, await findSlot(db, row.slot_id, now), now);
}

async function replay(db, row, request, now) {
  if (safeNumber(row.slot_id) !== request.slotId || safeNumber(row.quantity) !== request.quantity) {
    throw new ApiError(409, 'REQUEST_KEY_CONFLICT', 'This request key was already used for a different hold. Start a new reservation attempt.');
  }
  return { status: 200, hold: await response(db, row, now) };
}

export async function createHold(db, body, clock = () => new Date()) {
  const request = holdRequest(body);
  try {
    return await db.transaction(async client => {
      const earlier = await findHoldByRequestId(client, request.requestId);
      if (earlier) return replay(client, earlier, request, clock());
      // Bookings and owner capacity edits use this same session-row lock.
      const { rows } = await client.query('SELECT id FROM slots WHERE id=$1 FOR UPDATE', [request.slotId]);
      if (!rows[0]) throw new ApiError(404, 'SLOT_NOT_FOUND', 'Session not found.');
      const raced = await findHoldByRequestId(client, request.requestId);
      if (raced) return replay(client, raced, request, clock());
      const now = clock();
      const slot = await findSlot(client, request.slotId, now);
      checkBookable(slot, request.quantity, now);
      const deadline = now.getTime() + HOLD_DURATION_MS;
      const expiresAt = new Date(slot.bookingClosesAt === null ? deadline : Math.min(deadline, Date.parse(slot.bookingClosesAt)));
      const { rows: [saved] } = await client.query(`INSERT INTO seat_holds
        (request_id,slot_id,quantity,expires_at,created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [request.requestId, request.slotId, request.quantity, expiresAt, now]);
      return { status: 201, hold: await response(client, saved, now) };
    });
  } catch (error) {
    // Same retry key on different session locks: inspect only after rollback.
    if (error.code === '23505') {
      const saved = await findHoldByRequestId(db, request.requestId);
      if (saved) return replay(db, saved, request, clock());
    }
    throw error;
  }
}

// Janelle (M3): shared hold check for quote and booking conversion.
// Booking callers must already hold the slot lock; pass lock=true to lock the hold row too.
export async function requireActiveHold(db, holdId, request, now, { lock = false } = {}) {
  const { rows: [row] } = await db.query('SELECT * FROM seat_holds WHERE id=$1' + (lock ? ' FOR UPDATE' : ''), [holdId]);
  if (!row) throw new ApiError(404, 'HOLD_NOT_FOUND', 'Seat hold not found. Start a new reservation.');
  if (safeNumber(row.slot_id) !== request.slotId || safeNumber(row.quantity) !== request.quantity) {
    throw new ApiError(409, 'HOLD_MISMATCH', 'This seat hold is for a different session or quantity. Start a new reservation.');
  }
  const status = holdStatus(row, now);
  if (status === 'converted') throw new ApiError(409, 'HOLD_CONVERTED', 'This hold has already become a saved booking.');
  if (status === 'released') throw new ApiError(409, 'HOLD_RELEASED', 'This seat hold was released. Start a new reservation.');
  if (status === 'expired') throw new ApiError(409, 'HOLD_EXPIRED', 'Your 10-minute seat hold expired, so the seats were released. Start a new reservation.');
  return row;
}

export async function getHold(db, id, now) {
  const row = await findHold(db, uuid(id, 'id'));
  if (!row) throw new ApiError(404, 'HOLD_NOT_FOUND', 'Seat hold not found.');
  return response(db, row, now);
}

export async function releaseHold(db, id, clock = () => new Date()) {
  const holdId = uuid(id, 'id');
  return db.transaction(async client => {
    const row = await findHold(client, holdId);
    if (!row) throw new ApiError(404, 'HOLD_NOT_FOUND', 'Seat hold not found.');
    // Lock session before hold, matching the booking conversion lock order.
    await client.query('SELECT id FROM slots WHERE id=$1 FOR UPDATE', [row.slot_id]);
    const { rows: [locked] } = await client.query('SELECT * FROM seat_holds WHERE id=$1 FOR UPDATE', [holdId]);
    const now = clock();
    if (locked.status === 'converted') throw new ApiError(409, 'HOLD_CONVERTED', 'This hold has already become a saved booking.');
    if (holdStatus(locked, now) === 'active') {
      await client.query("UPDATE seat_holds SET status='released' WHERE id=$1", [holdId]);
      locked.status = 'released';
    }
    return response(client, locked, now);
  });
}
