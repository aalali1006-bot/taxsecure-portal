import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const firms = mysqlTable("firms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  tenantKey: varchar("tenantKey", { length: 64 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const firmMemberships = mysqlTable("firmMemberships", {
  id: int("id").autoincrement().primaryKey(),
  firmId: int("firmId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["firm_admin", "caseworker"]).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const clientProfiles = mysqlTable("clientProfiles", {
  id: int("id").autoincrement().primaryKey(),
  firmId: int("firmId").notNull(),
  userId: int("userId").notNull(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  clientReference: varchar("clientReference", { length: 64 }).notNull(),
  dataMode: mysqlEnum("dataMode", ["demo", "production"]).default("demo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const taxDocuments = mysqlTable("taxDocuments", {
  id: int("id").autoincrement().primaryKey(),
  firmId: int("firmId").notNull(),
  clientProfileId: int("clientProfileId").notNull(),
  externalReference: varchar("externalReference", { length: 64 }).notNull(),
  originalFilename: varchar("originalFilename", { length: 160 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 640 }).notNull(),
  status: mysqlEnum("status", ["submitted", "under_review", "query", "completed"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const documentAuditEvents = mysqlTable("documentAuditEvents", {
  id: int("id").autoincrement().primaryKey(),
  firmId: int("firmId").notNull(),
  documentId: int("documentId"),
  actorUserId: int("actorUserId"),
  actorRole: varchar("actorRole", { length: 32 }).notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  metadataSummary: text("metadataSummary").notNull(),
  previousHash: varchar("previousHash", { length: 64 }).notNull(),
  eventHash: varchar("eventHash", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const teamsHandoffs = mysqlTable("teamsHandoffs", {
  id: int("id").autoincrement().primaryKey(),
  firmId: int("firmId").notNull(),
  documentId: int("documentId").notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  portalReference: varchar("portalReference", { length: 240 }).notNull(),
  payloadHash: varchar("payloadHash", { length: 64 }).notNull(),
  attachmentCount: int("attachmentCount").default(0).notNull(),
  deliveryMode: mysqlEnum("deliveryMode", ["simulated", "graph"]).default("simulated").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
