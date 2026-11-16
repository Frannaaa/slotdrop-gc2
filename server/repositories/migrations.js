import { readFile } from "node:fs/promises";
import { ensureReferenceCatalog } from "./reference-catalog.js";

const coreTables = ["providers", "services", "slots", "bookings"];

export async function bootstrapDatabase(db) {
  return db.transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(47531008)");
    const { rows } = await client.query(
      "SELECT name FROM unnest($1::text[]) AS names(name) WHERE to_regclass(name) IS NOT NULL",
      [[...coreTables, "provider_applications"]],
    );
    const present = new Set(rows.map(({ name }) => name));
    // Older databases have all four core tables before migration 003 adds applications.
    if (coreTables.every((name) => present.has(name))) return false;
    if (present.size > 0) {
      throw new Error("Partial SlotDrop schema. Inspect the database before deploying.");
    }

    for (const name of ["schema.sql", "seed.sql"]) {
      const sql = await readFile(new URL("../../db/" + name, import.meta.url), "utf8");
      await client.query(sql.replace(/^(BEGIN|COMMIT);\s*$/gm, ""));
    }
    return true;
  });
}

export async function migrateDatabase(db) {
  for (const name of [
    "001_activity_attributes.sql",
    "002_studio_references.sql",
    "003_provider_applications.sql",
    "004_practice_sessions.sql",
    "005_demo_choice_variants.sql",
  ]) {
    const sql = await readFile(
      new URL("../../db/migrations/" + name, import.meta.url),
      "utf8",
    );
    await db.transaction((client) => client.query(sql));
  }
}

export async function upgradeDatabase(db) {
  await migrateDatabase(db);
  await ensureReferenceCatalog(db);
}
