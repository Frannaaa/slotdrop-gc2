// Log diagnostic codes without exposing connection strings, SQL or customer data.
export function errorCode(error) {
  return typeof error?.code === 'string' && /^[A-Z0-9_]{1,32}$/.test(error.code)
    ? error.code : 'UNKNOWN';
}
export async function closeDatabase(db, report = console.error) {
  try { await db.close(); return true; }
  catch (error) { report('Database shutdown failed:', errorCode(error)); return false; }
}
