import { describe, expect, it } from "vitest";
import {
  MAX_DOCUMENT_SIZE_BYTES,
  canTransitionDocument,
  createMinimalTeamsNotification,
  validateDocumentUpload,
} from "./security";

describe("TaxSecure security controls", () => {
  it("accepts the permitted document types within the size boundary", () => {
    expect(() => validateDocumentUpload({ filename: "Beleg_2026-04.pdf", mimeType: "application/pdf", sizeBytes: 1024 })).not.toThrow();
  });

  it("rejects unapproved document types and oversized uploads", () => {
    expect(() => validateDocumentUpload({ filename: "ledger.xls", mimeType: "application/vnd.ms-excel", sizeBytes: 1024 })).toThrow();
    expect(() => validateDocumentUpload({ filename: "too-large.pdf", mimeType: "application/pdf", sizeBytes: MAX_DOCUMENT_SIZE_BYTES + 1 })).toThrow();
  });

  it("enforces least-privilege workflow transitions", () => {
    expect(canTransitionDocument("query", "submitted", "client")).toBe(true);
    expect(canTransitionDocument("submitted", "completed", "client")).toBe(false);
    expect(canTransitionDocument("under_review", "completed", "caseworker")).toBe(true);
  });

  it("creates a Teams payload with metadata only and no attachment", () => {
    const payload = createMinimalTeamsNotification({ documentId: "TS-1042", event: "review_requested" });
    expect(payload).toMatchObject({ documentRef: "TS-1042", attachmentCount: 0, dataClassification: "metadata_only" });
    expect(Object.keys(payload)).not.toContain("content");
  });
});
