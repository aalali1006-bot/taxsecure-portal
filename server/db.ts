import { and, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  clientProfiles,
  documentAuditEvents,
  firms,
  firmMemberships,
  InsertUser,
  taxDocuments,
  teamsHandoffs,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { createAuditHash } from "./taxsecure/security";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function ensureDemoPortalContext(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Datenbankverbindung nicht verfügbar.");

  const existingMembership = await db.select().from(firmMemberships).where(eq(firmMemberships.userId, userId)).limit(1);
  if (existingMembership[0]) {
    const profile = await db.select().from(clientProfiles).where(and(eq(clientProfiles.firmId, existingMembership[0].firmId), eq(clientProfiles.userId, userId))).limit(1);
    if (profile[0]) return { firmId: existingMembership[0].firmId, clientProfileId: profile[0].id };
  }

  const [firm] = await db.insert(firms).values({ name: "Kanzlei Nordblick · DEMO", tenantKey: `demo-${userId}-${Date.now()}` }).$returningId();
  await db.insert(firmMemberships).values({ firmId: firm.id, userId, role: "firm_admin", active: true });
  const [profile] = await db.insert(clientProfiles).values({
    firmId: firm.id,
    userId,
    displayName: "Nordlicht Beratung GmbH · DEMO",
    clientReference: `DEMO-${userId}`,
    dataMode: "demo",
  }).$returningId();
  return { firmId: firm.id, clientProfileId: profile.id };
}

export async function getDocumentForActor(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Datenbankverbindung nicht verfügbar.");
  const document = await db.select().from(taxDocuments).where(eq(taxDocuments.id, documentId)).limit(1);
  const item = document[0];
  if (!item) return undefined;

  const membership = await db.select().from(firmMemberships).where(and(eq(firmMemberships.firmId, item.firmId), eq(firmMemberships.userId, userId), eq(firmMemberships.active, true))).limit(1);
  const ownProfile = await db.select().from(clientProfiles).where(and(eq(clientProfiles.id, item.clientProfileId), eq(clientProfiles.userId, userId))).limit(1);
  if (!membership[0] && !ownProfile[0]) throw new Error("FORBIDDEN_DOCUMENT_ACCESS");
  return item;
}

export async function listDocumentsForActor(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const memberships = await db.select().from(firmMemberships).where(and(eq(firmMemberships.userId, userId), eq(firmMemberships.active, true)));
  const profiles = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId));
  const clauses = [
    ...memberships.map(membership => eq(taxDocuments.firmId, membership.firmId)),
    ...profiles.map(profile => eq(taxDocuments.clientProfileId, profile.id)),
  ];
  if (clauses.length === 0) return [];
  return db.select().from(taxDocuments).where(or(...clauses)).orderBy(desc(taxDocuments.updatedAt));
}

export async function recordAuditEvent(input: {
  firmId: number;
  documentId?: number;
  actorUserId?: number;
  actorRole: string;
  eventType: string;
  metadataSummary: string;
}) {
  const db = await getDb();
  if (!db) return;
  const lastEvent = await db.select().from(documentAuditEvents).where(eq(documentAuditEvents.firmId, input.firmId)).orderBy(desc(documentAuditEvents.id)).limit(1);
  const previousHash = lastEvent[0]?.eventHash ?? "GENESIS";
  const createdAt = new Date().toISOString();
  const eventHash = createAuditHash({
    previousHash,
    eventType: input.eventType,
    actorRef: String(input.actorUserId ?? "system"),
    resourceRef: String(input.documentId ?? input.firmId),
    occurredAt: createdAt,
  });
  await db.insert(documentAuditEvents).values({
    ...input,
    documentId: input.documentId ?? null,
    actorUserId: input.actorUserId ?? null,
    previousHash,
    eventHash,
  });
}

export async function recordTeamsHandoff(input: {
  firmId: number;
  documentId: number;
  eventType: string;
  portalReference: string;
  payloadHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Datenbankverbindung nicht verfügbar.");
  await db.insert(teamsHandoffs).values({ ...input, attachmentCount: 0, deliveryMode: "simulated" });
}

export async function createTaxDocument(input: {
  firmId: number;
  clientProfileId: number;
  externalReference: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  storageUrl: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Datenbankverbindung nicht verfügbar.");
  const [created] = await db.insert(taxDocuments).values(input).$returningId();
  return created.id;
}

export async function transitionDocumentForActor(input: {
  documentId: number;
  userId: number;
  to: "submitted" | "under_review" | "query" | "completed";
}) {
  const db = await getDb();
  if (!db) throw new Error("Datenbankverbindung nicht verfügbar.");
  const document = await getDocumentForActor(input.documentId, input.userId);
  if (!document) throw new Error("DOCUMENT_NOT_FOUND");
  const membership = await db.select().from(firmMemberships).where(and(eq(firmMemberships.firmId, document.firmId), eq(firmMemberships.userId, input.userId), eq(firmMemberships.active, true))).limit(1);
  const ownProfile = await db.select().from(clientProfiles).where(and(eq(clientProfiles.id, document.clientProfileId), eq(clientProfiles.userId, input.userId))).limit(1);
  const actorRole = membership[0]?.role ?? (ownProfile[0] ? "client" : undefined);
  if (!actorRole) throw new Error("FORBIDDEN_DOCUMENT_ACCESS");
  const { canTransitionDocument } = await import("./taxsecure/security");
  if (!canTransitionDocument(document.status, input.to, actorRole)) throw new Error("FORBIDDEN_STATUS_TRANSITION");
  await db.update(taxDocuments).set({ status: input.to }).where(eq(taxDocuments.id, document.id));
  await recordAuditEvent({
    firmId: document.firmId,
    documentId: document.id,
    actorUserId: input.userId,
    actorRole,
    eventType: "document_status_changed",
    metadataSummary: `Statuswechsel ${document.status} → ${input.to}; Beleginhalt nicht protokolliert.`,
  });
  return { id: document.id, previousStatus: document.status, status: input.to, actorRole };
}
