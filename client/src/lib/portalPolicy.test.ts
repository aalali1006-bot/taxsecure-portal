import { describe, expect, it } from "vitest";
import { CLIENT_MAX_DOCUMENT_SIZE_BYTES, clientUploadValidation, documentsVisibleToClient } from "./portalPolicy";

describe("client portal policy", () => {
  it("shows clients only client-visible documents", () => {
    const visible = documentsVisibleToClient([
      { id: "own", ownerVisibility: "client" as const },
      { id: "internal", ownerVisibility: "firm" as const },
    ]);
    expect(visible.map(document => document.id)).toEqual(["own"]);
  });

  it("pre-validates only permitted document formats and sizes", () => {
    expect(clientUploadValidation({ name: "beleg.pdf", type: "application/pdf", size: 4000 })).toMatchObject({ accepted: true });
    expect(clientUploadValidation({ name: "beleg.exe", type: "application/x-msdownload", size: 4000 })).toMatchObject({ accepted: false });
    expect(clientUploadValidation({ name: "gross.pdf", type: "application/pdf", size: CLIENT_MAX_DOCUMENT_SIZE_BYTES + 1 })).toMatchObject({ accepted: false });
  });
});
