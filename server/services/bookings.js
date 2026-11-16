// Group assignment: Janelle (M3). Booking save (#15) and receipt readback (#16), per docs/routes.md.
import { COMMISSION_BASIS_POINTS, MAX_SEATS } from '../config/business.js';
import { ApiError, invalid, object, safeNumber } from '../lib/validation.js';
import { SLOT_SELECT, slotResponse } from '../repositories/slots.js';
import { checkBookable, priceQuote } from './pricing.js';

const FIELDS = ['requestId', 'slotId', 'quantity', 'customerName', 'customerEmail', 'paymentMethod', 'expectedTotalCentavos'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYMENT_METHODS = ['mock_card', 'pay_on_site'];

// Receipts are read back from the saved row, never rebuilt from the live slot or the browser.
const RECEIPT_SELECT = `SELECT b.id,b.request_id,b.slot_id,b.quantity,b.customer_name,b.customer_email,
  b.payment_method,b.status,b.session_starts_at,b.original_unit_price_centavos,b.offer_unit_price_centavos,
  b.unit_price_centavos,b.pricing_type,b.commission_basis_points,b.total_price_centavos,
  b.platform_fee_centavos,b.provider_payout_centavos,b.created_at,s.name AS service_name,p.name AS provider_name
  FROM bookings b JOIN slots sl ON sl.id=b.slot_id JOIN services s ON s.id=sl.service_id JOIN providers p ON p.id=s.provider_id`;

function jsonInteger(value, name, min, max) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) invalid(name + ' must be a JSON integer.');
  if (value < min || value > max) invalid(name + ' is outside the allowed range.');
  return value;
}

function text(value, name, max) {
  if (typeof value !== 'string') invalid(name + ' must be text.');
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > max) invalid(name + ' must be 1-' + max + ' characters.');
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) invalid(name + ' contains unsupported characters.');
  return trimmed;
}

export function uuid(value, name) {
  if (typeof value !== 'string' || !UUID.test(value)) invalid(name + ' must be a UUID.');
  return value.toLowerCase();
}

// Normalize once so an identical network retry compares equal to the saved request.
export function bookingRequest(body) {
  object(body, FIELDS);
  for (const key of FIELDS) if (body[key] === undefined) invalid('Provide ' + key + '.');
  const customerEmail = text(body.customerEmail, 'customerEmail', 254);
  if (!EMAIL.test(customerEmail)) invalid('customerEmail must be a valid email address.');
  if (!PAYMENT_METHODS.includes(body.paymentMethod)) invalid('paymentMethod must be mock_card or pay_on_site.');
  return {
    requestId: uuid(body.requestId, 'requestId'),
    slotId: jsonInteger(body.slotId, 'slotId', 1, Number.MAX_SAFE_INTEGER),
    quantity: jsonInteger(body.quantity, 'quantity', 1, MAX_SEATS),
    customerName: text(body.customerName, 'customerName', 100),
    customerEmail,
    paymentMethod: body.paymentMethod,
    expectedTotalCentavos: jsonInteger(body.expectedTotalCentavos, 'expectedTotalCentavos', 0, Number.MAX_SAFE_INTEGER)
  };
}

export function receiptResponse(row) {
  const number = key => safeNumber(row[key]);
  return {
    id: row.id, slotId: number('slot_id'), quantity: number('quantity'),
    paymentMethod: row.payment_method, status: row.status,
    serviceName: row.service_name, providerName: row.provider_name,
    sessionStartsAt: row.session_starts_at === null ? null : new Date(row.session_starts_at).toISOString(),
    originalUnitPriceCentavos: number('original_unit_price_centavos'), offerUnitPriceCentavos: number('offer_unit_price_centavos'),
    unitPriceCentavos: number('unit_price_centavos'), pricingType: row.pricing_type,
    commissionBasisPoints: number('commission_basis_points'), totalPriceCentavos: number('total_price_centavos'),
    platformFeeCentavos: number('platform_fee_centavos'), providerPayoutCentavos: number('provider_payout_centavos'),
    createdAt: new Date(row.created_at).toISOString()
  };
}

function sameRequest(row, request) {
  // Private fields are compared inside the server, never returned as a receipt.
  return safeNumber(row.slot_id) === request.slotId && safeNumber(row.quantity) === request.quantity
    && row.customer_name === request.customerName && row.customer_email === request.customerEmail
    && row.payment_method === request.paymentMethod && safeNumber(row.total_price_centavos) === request.expectedTotalCentavos;
}

async function findByRequestId(client, requestId) {
  const { rows } = await client.query(RECEIPT_SELECT + ' WHERE b.request_id=$1', [requestId]);
  return rows[0] || null;
}

// An identical retry returns the original receipt (200), even after the session closes.
function replay(receipt, request) {
  if (!sameRequest(receipt, request)) {
    throw new ApiError(409, 'REQUEST_KEY_CONFLICT', 'This request key was already used for a different booking. Start a new booking.');
  }
  return { status: 200, receipt: receiptResponse(receipt) };
}

export async function createBooking(db, body, clock) {
  const request = bookingRequest(body);
  try {
    return await db.transaction(async client => {
      // 1. Cheap check before taking the slot lock.
      const earlier = await findByRequestId(client, request.requestId);
      if (earlier) return replay(earlier, request);
      // 2. Lock the session row so concurrent bookings and owner edits queue behind us.
      const { rows: locked } = await client.query('SELECT id FROM slots WHERE id=$1 FOR UPDATE', [request.slotId]);
      if (!locked[0]) throw new ApiError(404, 'SLOT_NOT_FOUND', 'Session not found.');
      const raced = await findByRequestId(client, request.requestId);
      if (raced) return replay(raced, request);
      // 3. Recheck eligibility and confirmed seats after the lock, with the time read after the lock.
      const { rows } = await client.query(SLOT_SELECT + ' WHERE sl.id=$1', [request.slotId]);
      const slot = slotResponse(rows[0]);
      const now = clock();
      checkBookable(slot, request.quantity, now);
      // 4-5. Server picks the tier and totals; the browser only acknowledges the amount it saw.
      const quote = priceQuote(slot, request.quantity, now, COMMISSION_BASIS_POINTS);
      if (quote.totalPriceCentavos !== request.expectedTotalCentavos) {
        throw new ApiError(409, 'PRICE_CHANGED', 'The price for this booking changed. Please review the new total.', { quote });
      }
      // 6. Save receipt snapshots so later offer edits never rewrite this booking.
      const { rows: [saved] } = await client.query(`INSERT INTO bookings (request_id,slot_id,quantity,customer_name,customer_email,payment_method,
        session_starts_at,original_unit_price_centavos,offer_unit_price_centavos,pricing_type,unit_price_centavos,commission_basis_points,
        total_price_centavos,platform_fee_centavos,provider_payout_centavos)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [request.requestId, request.slotId, request.quantity, request.customerName, request.customerEmail, request.paymentMethod,
          slot.startsAt, quote.originalUnitPriceCentavos, quote.offerUnitPriceCentavos, quote.pricingType, quote.unitPriceCentavos,
          COMMISSION_BASIS_POINTS, quote.totalPriceCentavos, quote.platformFeeCentavos, quote.providerPayoutCentavos]);
      const { rows: [row] } = await client.query(RECEIPT_SELECT + ' WHERE b.id=$1', [saved.id]);
      return { status: 201, receipt: receiptResponse(row) };
    });
  } catch (error) {
    // Same key saved concurrently on another slot lock: the transaction rolled back, so compare the saved request.
    if (error.code === '23505') {
      const saved = await findByRequestId(db, request.requestId);
      if (saved) return replay(saved, request);
    }
    throw error;
  }
}

export async function findReceipt(db, id) {
  const bookingId = uuid(id, 'id');
  const { rows } = await db.query(RECEIPT_SELECT + ' WHERE b.id=$1', [bookingId]);
  if (!rows[0]) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  return receiptResponse(rows[0]);
}
