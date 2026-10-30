// Log diagnostic codes without exposing connection strings, SQL or customer data.
export function errorCode(error) {
  return typeof error?.code === 'string' && /^[A-Z0-9_]{1,32}$/.test(error.code)
    ? error.code : 'UNKNOWN';
}
export async function closeDatabase(db, report = console.error) {
  try { await db.close(); return true; }
  catch (error) { report('Database shutdown failed:', errorCode(error)); return false; }
}

/** A deployed GC2 build must not advertise a healthy app without its database. */
export function validateProductionDatabase(env = process.env) {
  if (env.NODE_ENV === 'production' && (typeof env.DATABASE_URL !== 'string' || !env.DATABASE_URL.trim())) {
    throw new Error('DATABASE_URL is required in production. Configure a persistent course database before starting SlotDrop.');
  }
}
