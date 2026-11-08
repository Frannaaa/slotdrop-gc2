// Group assignment: Fran. Studio references and pending applications.
import { createHash } from "node:crypto";
import { ApiError, integer, invalid, object } from "../lib/validation.js";
import { studioReferences } from "../repositories/reference-catalog.js";
import { listSlots } from "./discovery.js";
const types = ["pottery", "painting", "pilates", "dance", "other"];
function uuid(value) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
  )
    invalid("Open a valid application reference.");
  return value.toLowerCase();
}
function text(value, name, max) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > max ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    invalid("Enter a valid " + name + ".");
  return value.trim();
}
function normalize(body) {
  object(body, [
    "requestId",
    "providerId",
    "businessName",
    "website",
    "city",
    "area",
    "activityTypes",
    "contactName",
    "contactEmail",
    "representativeRole",
    "authorized",
    "demoAcknowledged",
  ]);
  const input = {
    requestId: uuid(body.requestId),
    providerId:
      body.providerId == null ? null : integer(body.providerId, "providerId"),
    businessName: text(body.businessName, "studio name", 120),
    website: text(body.website, "public website", 2048),
    city: text(body.city, "city", 100),
    area: text(body.area, "area", 100),
    contactName: text(body.contactName, "contact name", 100),
    contactEmail: text(body.contactEmail, "contact email", 254),
    representativeRole: body.representativeRole,
  };
  let url;
  try {
    url = new URL(input.website);
  } catch {
    invalid("Enter a complete HTTPS website or social-profile link.");
  }
  if (url.protocol !== "https:" || url.username || url.password)
    invalid("Use an HTTPS link without a username or password.");
  input.website = url.href;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail))
    invalid("Enter a valid contact email.");
  if (
    !["owner", "manager", "authorized_representative"].includes(
      input.representativeRole,
    )
  )
    invalid("Choose your relationship to the studio.");
  if (
    !Array.isArray(body.activityTypes) ||
    !body.activityTypes.length ||
    body.activityTypes.length > 5 ||
    body.activityTypes.some((type) => !types.includes(type)) ||
    new Set(body.activityTypes).size !== body.activityTypes.length
  )
    invalid("Choose one or more supported activities.");
  input.activityTypes = [...body.activityTypes].sort();
  if (body.authorized !== true || body.demoAcknowledged !== true)
    invalid(
      "Confirm authorization and the course-demo notice before submitting.",
    );
  return input;
}
const summary = (row) => ({
  id: row.id,
  status: row.status,
  createdAt: new Date(row.created_at).toISOString(),
});
export async function findProvider(db, providerId, clock) {
  const id = integer(providerId, "providerId");
  const {
    rows: [provider],
  } = await db.query(
    "SELECT id,name,city,area,reference_key FROM providers WHERE id=$1",
    [id],
  );
  if (!provider?.reference_key)
    throw new ApiError(
      404,
      "PROVIDER_NOT_FOUND",
      "Studio reference not found.",
    );
  const { rows } = await db.query(
    "SELECT id,reference_key FROM services WHERE provider_id=$1 AND active AND reference_key IS NOT NULL ORDER BY id",
    [id],
  );
  const activities = rows
    .map((row) => ({
      serviceId: Number(row.id),
      ...studioReferences.get(row.reference_key),
    }))
    .filter((r) => r.key);
  const slots = await listSlots(db, {}, clock(), id);
  return {
    id: Number(provider.id),
    name: provider.name,
    city: provider.city,
    area: provider.area,
    profileStatus: "unclaimed_reference",
    partnershipConfirmed: false,
    activities,
    slots,
  };
}
export async function createApplication(db, body) {
  const input = normalize(body),
    signature = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");
  const result = await db.transaction(async (client) => {
    const existing = (
      await client.query(
        "SELECT id,status,created_at,payload_signature FROM provider_applications WHERE request_id=$1",
        [input.requestId],
      )
    ).rows[0];
    const retry = (row) => {
      if (row.payload_signature !== signature)
        throw new ApiError(
          409,
          "REQUEST_CONFLICT",
          "This application reference was already used with different details.",
        );
      return { created: false, row };
    };
    if (existing) return retry(existing);
    if (
      input.providerId !== null &&
      !(
        await client.query(
          "SELECT id FROM providers WHERE id=$1 AND reference_key IS NOT NULL",
          [input.providerId],
        )
      ).rows.length
    )
      throw new ApiError(
        404,
        "PROVIDER_NOT_FOUND",
        "Studio reference not found.",
      );
    const {
      rows: [saved],
    } = await client.query(
      `INSERT INTO provider_applications(request_id,payload_signature,provider_id,business_name,website,city,area,activity_types,contact_name,contact_email,representative_role,authorized,demo_acknowledged)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,true) ON CONFLICT(request_id) DO NOTHING RETURNING id,status,created_at`,
      [
        input.requestId,
        signature,
        input.providerId,
        input.businessName,
        input.website,
        input.city,
        input.area,
        input.activityTypes,
        input.contactName,
        input.contactEmail,
        input.representativeRole,
      ],
    );
    if (saved) return { created: true, row: saved };
    return retry(
      (
        await client.query(
          "SELECT id,status,created_at,payload_signature FROM provider_applications WHERE request_id=$1",
          [input.requestId],
        )
      ).rows[0],
    );
  });
  return {
    status: result.created ? 201 : 200,
    application: summary(result.row),
  };
}
export async function findApplication(db, applicationId) {
  const {
    rows: [row],
  } = await db.query(
    "SELECT id,status,created_at FROM provider_applications WHERE id=$1",
    [uuid(applicationId)],
  );
  if (!row)
    throw new ApiError(
      404,
      "APPLICATION_NOT_FOUND",
      "Application reference not found.",
    );
  return summary(row);
}
