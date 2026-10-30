import { safeNumber } from '../lib/validation.js';
import { SLOT_SELECT, slotResponse } from './slots.js';
import { COMMISSION_BASIS_POINTS, DISCOVERY_HOURS } from '../config/business.js';

export async function ownerCatalog(db) {
  const {rows: services} = await db.query(`SELECT s.*,p.name AS provider_name FROM services s JOIN providers p ON p.id=s.provider_id ORDER BY s.id`);
  const {rows: slots} = await db.query(SLOT_SELECT + ' ORDER BY sl.starts_at,sl.id');
  return { commissionBasisPoints: COMMISSION_BASIS_POINTS, discoveryHours: DISCOVERY_HOURS,
    services: services.map(row => ({ id:safeNumber(row.id),providerId:safeNumber(row.provider_id),providerName:row.provider_name,name:row.name,active:row.active,defaultBookingCutoffMinutes:row.default_booking_cutoff_minutes })),
    slots: slots.map(slotResponse) };
}
export async function listBookings(db) {
  // The GC2 owner screen has no login. Return an explicit non-contact summary.
  const {rows} = await db.query(`SELECT b.id,b.slot_id,b.quantity,b.status,b.session_starts_at,
    b.original_unit_price_centavos,b.offer_unit_price_centavos,b.pricing_type,b.unit_price_centavos,
    b.commission_basis_points,b.total_price_centavos,b.platform_fee_centavos,b.provider_payout_centavos,
    b.created_at,s.name AS service_name,p.name AS provider_name FROM bookings b JOIN slots sl ON sl.id=b.slot_id
    JOIN services s ON s.id=sl.service_id JOIN providers p ON p.id=s.provider_id ORDER BY b.created_at DESC,b.id`);
  const numeric = new Set(['slot_id','quantity','original_unit_price_centavos','offer_unit_price_centavos','unit_price_centavos','commission_basis_points','total_price_centavos','platform_fee_centavos','provider_payout_centavos']);
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => [key.replace(/_([a-z])/g,(_match,letter)=>letter.toUpperCase()),
    numeric.has(key) ? safeNumber(value) : value instanceof Date ? value.toISOString() : value])));
}
export async function ownerMetrics(db, now) {
  const {rows:[row]} = await db.query(`WITH confirmed AS (SELECT * FROM bookings WHERE status='confirmed'),
    rankings AS (SELECT s.id,s.name,SUM(b.quantity) AS seats FROM confirmed b JOIN slots sl ON sl.id=b.slot_id JOIN services s ON s.id=sl.service_id GROUP BY s.id,s.name ORDER BY seats DESC,s.id LIMIT 1)
    SELECT (SELECT COUNT(*) FROM confirmed) AS count,
      (SELECT COALESCE(SUM(platform_fee_centavos),0) FROM confirmed) AS revenue,
      (SELECT COALESCE(ROUND(AVG(total_price_centavos)),0) FROM confirmed) AS average,
      (SELECT json_build_object('serviceId',id,'serviceName',name,'seatsSold',seats) FROM rankings) AS top,
      (SELECT COUNT(*) FROM slots sl JOIN services s ON s.id=sl.service_id
       WHERE s.active AND sl.status='open' AND sl.runs_as_scheduled AND sl.starts_at > $1 AND sl.starts_at < $2 AND sl.booking_closes_at > $1
       AND sl.capacity-COALESCE((SELECT SUM(quantity) FROM confirmed WHERE slot_id=sl.id),0) BETWEEN 1 AND sl.capacity*0.25) AS nearly_full`,
    [now,new Date(now.getTime()+DISCOVERY_HOURS*3600000)]);
  return {bookingCount:safeNumber(row.count),platformRevenueCentavos:safeNumber(row.revenue),averageOrderValueCentavos:safeNumber(row.average),
    topSellingService:row.top ? {...row.top,serviceId:safeNumber(row.top.serviceId),seatsSold:safeNumber(row.top.seatsSold)} : null,
    nearlyFullSessionCount:safeNumber(row.nearly_full)};
}
