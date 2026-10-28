export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export function invalid(message) { throw new ApiError(400, 'INVALID_INPUT', message); }
export function integer(value, name, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^\d+$/.test(String(value))) invalid(name + ' must be an integer.');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) invalid(name + ' is outside the allowed range.');
  return number;
}
export function timestamp(value, name) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) || !Number.isFinite(Date.parse(value))) invalid(name + ' must be an ISO timestamp with a timezone.');
  const calendarDay = new Date(value.slice(0,10) + 'T00:00:00Z');
  if (!Number.isFinite(calendarDay.getTime()) || calendarDay.toISOString().slice(0,10) !== value.slice(0,10)) invalid(name + ' has an invalid calendar date.');
  const date = new Date(value);
  if (date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) invalid(name + ' must resolve to a UTC year from 0001 to 9999.');
  return date;
}
export function object(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Send a JSON object.');
  for (const key of Object.keys(value)) if (!allowed.includes(key)) invalid('Unsupported field: ' + key);
  return value;
}
export function safeNumber(value) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error('Unsafe database integer');
  return number;
}
