import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  createTaxDocument,
  ensureDemoPortalContext,
  getDocumentForActor,
  listDocumentsForActor,
  recordAuditEvent,
  recordTeamsHandoff,
  transitionDocumentForActor,
} from "../db";
import { storageGetSignedUrl, storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";
import {
  canTransitionDocument,
  createMinimalTeamsNotification,
  type PortalActorRole,
  validateDocumentUpload,
} from "../taxsecure/security";
import { evaluateZeroTrustAccess } from "../zscaler/policy";

const uploadSchema = z.object({
  filename: z.string().min(1).max(160),
  mimeType: z.string().min(3).max(120),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024),
  contentBase64: z.string().min(4).max(14 * 1024 * 1024),
});

const statusSchema = z.enum(["submitted", "under_review", "query", "completed"]);

function toForbiddenError(error: unknown) {
  if (error instanceof Error && error.message === "FORBIDDEN_DOCUMENT_ACCESS") {
    return new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff auf dieses Dokument." });
  }
  return error;
}

export const taxsecureRouter = router({
  listDocuments: protectedProcedure.query(async ({ ctx }) => {
    const documents = await listDocumentsForActor(ctx.user.id);
    return documents.map(document => ({
      id: document.id,
      reference: document.externalReference,
      filename: document.originalFilename,
      status: document.status,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    }));
  }),

  getProtectedDocument: protectedProcedure.input(z.object({ documentId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    try {
      const document = await getDocumentForActor(input.documentId, ctx.user.id);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Dokument nicht gefunden." });
      await recordAuditEvent({
        firmId: document.firmId,
        documentId: document.id,
        actorUserId: ctx.user.id,
        actorRole: "authenticated_user",
        eventType: "document_accessed",
        metadataSummary: "Geschützter Zugriff; keine Dateiinhalte im Audit-Ereignis gespeichert.",
      });
      return { ...document, signedUrl: await storageGetSignedUrl(document.storageKey) };
    } catch (error) {
      throw toForbiddenError(error);
    }
  }),

  uploadDocument: protectedProcedure.input(uploadSchema).mutation(async ({ ctx, input }) => {
    validateDocumentUpload(input);
    const fileBytes = Buffer.from(input.contentBase64, "base64");
    if (fileBytes.byteLength !== input.sizeBytes) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Dateigröße stimmt nicht mit der Nutzlast überein." });
    }
    const context = await ensureDemoPortalContext(ctx.user.id);
    const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stored = await storagePut(`taxsecure/${context.firmId}/${context.clientProfileId}/${safeFilename}`, fileBytes, input.mimeType);
    const documentId = await createTaxDocument({
      firmId: context.firmId,
      clientProfileId: context.clientProfileId,
      externalReference: `TS-${Date.now().toString().slice(-6)}`,
      originalFilename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageKey: stored.key,
      storageUrl: stored.url,
    });
    await recordAuditEvent({
      firmId: context.firmId,
      documentId,
      actorUserId: ctx.user.id,
      actorRole: "client",
      eventType: "document_uploaded",
      metadataSummary: `Upload akzeptiert: ${input.mimeType}, ${input.sizeBytes} Bytes; Dateiinhalte werden nicht protokolliert.`,
    });
    return { accepted: true, documentId, storageReference: stored.key, storageUrl: stored.url, status: "submitted" as const };
  }),

  validateTransition: protectedProcedure.input(z.object({
    from: statusSchema,
    to: statusSchema,
    actorRole: z.enum(["client", "caseworker", "firm_admin"]),
  })).query(({ input }) => ({
    allowed: canTransitionDocument(input.from, input.to, input.actorRole as PortalActorRole),
  })),

  evaluateZeroTrustAccess: protectedProcedure.input(z.object({
    role: z.enum(["client", "caseworker", "firm_admin"]),
    devicePosture: z.enum(["compliant", "compliant_with_warnings", "non_compliant", "unknown"]),
    networkOrigin: z.enum(["corporate_network", "public_internet", "unmanaged_vpn"]),
    reauthenticatedSecondsAgo: z.number().int().nonnegative().max(86_400),
  })).query(({ input }) => evaluateZeroTrustAccess(input)),

  changeDocumentStatus: protectedProcedure.input(z.object({
    documentId: z.number().int().positive(),
    to: statusSchema,
  })).mutation(async ({ ctx, input }) => {
    try {
      return await transitionDocumentForActor({ documentId: input.documentId, userId: ctx.user.id, to: input.to });
    } catch (error) {
      if (error instanceof Error && error.message === "FORBIDDEN_STATUS_TRANSITION") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Dieser Statuswechsel ist für Ihre Rolle nicht erlaubt." });
      }
      throw toForbiddenError(error);
    }
  }),

  createTeamsHandoff: protectedProcedure.input(z.object({ documentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      const document = await getDocumentForActor(input.documentId, ctx.user.id);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Dokument nicht gefunden." });
      const payload = createMinimalTeamsNotification({ documentId: document.externalReference, event: "review_requested" });
      const payloadHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
      await recordTeamsHandoff({
        firmId: document.firmId,
        documentId: document.id,
        eventType: payload.event,
        portalReference: payload.portalUrl,
        payloadHash,
      });
      await recordAuditEvent({
        firmId: document.firmId,
        documentId: document.id,
        actorUserId: ctx.user.id,
        actorRole: "caseworker",
        eventType: "teams_handoff_created",
        metadataSummary: "Nur Ereignistyp, Dokumentreferenz und kontrollierter Portal-Link weitergegeben; keine Inhalte und keine Anhänge.",
      });
      return { deliveryMode: "simulated" as const, payload };
    } catch (error) {
      throw toForbiddenError(error);
    }
  }),
});
