import type { TaxDocumentStatus } from "./security";

export type DemoDocument = {
  id: string;
  reference: string;
  title: string;
  category: string;
  client: string;
  submittedAt: string;
  status: TaxDocumentStatus;
  ownerVisibility: "client" | "firm";
};

export const demoDocuments: DemoDocument[] = [
  {
    id: "demo-doc-1042",
    reference: "TS-1042",
    title: "Telekommunikation · April 2026",
    category: "Eingangsbeleg",
    client: "Nordlicht Beratung GmbH · DEMO",
    submittedAt: "Heute, 09:24",
    status: "under_review",
    ownerVisibility: "client",
  },
  {
    id: "demo-doc-1037",
    reference: "TS-1037",
    title: "Büromaterial · März 2026",
    category: "Eingangsbeleg",
    client: "Nordlicht Beratung GmbH · DEMO",
    submittedAt: "Gestern, 15:10",
    status: "query",
    ownerVisibility: "client",
  },
  {
    id: "demo-doc-1018",
    reference: "TS-1018",
    title: "Softwarelizenz · Februar 2026",
    category: "Eingangsbeleg",
    client: "Nordlicht Beratung GmbH · DEMO",
    submittedAt: "03. Apr., 11:48",
    status: "completed",
    ownerVisibility: "client",
  },
];

export const auditPreview = [
  { time: "09:24", event: "Dokument eingereicht", actor: "Mandantenportal", tone: "secure" },
  { time: "09:24", event: "Speicherreferenz verschlüsselt", actor: "Storage Gateway", tone: "neutral" },
  { time: "09:25", event: "Prüfauftrag erstellt", actor: "Kanzlei-Workflow", tone: "accent" },
  { time: "09:25", event: "Teams-Handoff minimiert", actor: "Integration Boundary", tone: "neutral" },
];
