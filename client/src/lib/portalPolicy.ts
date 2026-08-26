export const CLIENT_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const CLIENT_MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export function clientUploadValidation(file: { name: string; type: string; size: number }) {
  if (!CLIENT_ALLOWED_MIME_TYPES.has(file.type)) {
    return { accepted: false, reason: "Nur PDF, JPG oder PNG sind zulässig." } as const;
  }
  if (file.size <= 0 || file.size > CLIENT_MAX_DOCUMENT_SIZE_BYTES) {
    return { accepted: false, reason: "Die Datei muss zwischen 1 Byte und 10 MB groß sein." } as const;
  }
  return { accepted: true, reason: "Lokale Vorabprüfung bestanden." } as const;
}

export function documentsVisibleToClient<T extends { ownerVisibility: "client" | "firm" }>(documents: T[]) {
  return documents.filter(document => document.ownerVisibility === "client");
}
