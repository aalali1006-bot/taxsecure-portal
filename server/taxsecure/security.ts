import { createHash } from "node:crypto";

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export type TaxDocumentStatus = "submitted" | "under_review" | "query" | "completed";
export type PortalActorRole = "client" | "caseworker" | "firm_admin";

const transitions: Record<TaxDocumentStatus, TaxDocumentStatus[]> = {
  submitted: ["under_review", "query"],
  under_review: ["query", "completed"],
  query: ["submitted", "under_review"],
  completed: [],
};

export function validateDocumentUpload(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  if (!ALLOWED_DOCUMENT_TYPES.has(input.mimeType)) {
    throw new Error("Nur PDF-, JPG- und PNG-Dateien sind zulässig.");
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error("Die Datei muss zwischen 1 Byte und 10 MB groß sein.");
  }
  if (!/^[a-zA-Z0-9äöüÄÖÜß._ -]{1,160}$/.test(input.filename)) {
    throw new Error("Der Dateiname enthält nicht zugelassene Zeichen.");
  }
}

export function canTransitionDocument(
  from: TaxDocumentStatus,
  to: TaxDocumentStatus,
  actorRole: PortalActorRole,
) {
  if (!transitions[from].includes(to)) return false;
  if (actorRole === "client") return from === "query" && to === "submitted";
  return true;
}

export function createMinimalTeamsNotification(input: {
  documentId: string;
  event: "review_requested" | "client_query" | "completed";
}) {
  const payload = {
    event: input.event,
    documentRef: input.documentId,
    portalUrl: `/portal/documents/${encodeURIComponent(input.documentId)}`,
    dataClassification: "metadata_only",
    attachmentCount: 0,
  };
  assertTeamsPayloadIsMinimized(payload);
  return payload;
}

export function assertTeamsPayloadIsMinimized(payload: Record<string, unknown>) {
  const forbiddenKeys = ["content", "attachment", "fileBytes", "base64", "iban", "taxId"];
  const keys = Object.keys(payload).map(key => key.toLowerCase());
  if (keys.some(key => forbiddenKeys.includes(key))) {
    throw new Error("Teams-Handoff darf keine Beleginhalte, Anhänge oder Steuerdaten enthalten.");
  }
  if (payload.attachmentCount !== 0 || payload.dataClassification !== "metadata_only") {
    throw new Error("Teams-Handoff muss datensparsam und ohne Anhänge erfolgen.");
  }
}

export function createAuditHash(input: {
  previousHash: string;
  eventType: string;
  actorRef: string;
  resourceRef: string;
  occurredAt: string;
}) {
  return createHash("sha256")
    .update([input.previousHash, input.eventType, input.actorRef, input.resourceRef, input.occurredAt].join("|"))
    .digest("hex");
}
