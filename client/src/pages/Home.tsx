import { useState } from "react";
import {
  Activity, ArrowUpRight, Bell, Building2, CheckCircle2, ChevronRight, CircleAlert,
  ClipboardCheck, Database, FileCheck2, FileLock2, FileText, KeyRound, Link2,
  LockKeyhole, Network, Search, ServerCog, ShieldCheck, UploadCloud, UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoDocuments, auditPreview } from "../../../server/taxsecure/demo";
import { clientUploadValidation, documentsVisibleToClient } from "@/lib/portalPolicy";

type ViewMode = "client" | "firm";
type Panel = "workspace" | "security" | "audit";

const statusMap = {
  submitted: { label: "Eingereicht", className: "bg-slate-100 text-slate-700 ring-slate-200" },
  under_review: { label: "In Prüfung", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  query: { label: "Rückfrage", className: "bg-rose-50 text-rose-800 ring-rose-200" },
  completed: { label: "Abgeschlossen", className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
};

function StatusBadge({ status }: { status: keyof typeof statusMap }) {
  const tone = statusMap[status];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tone.className}`}>{tone.label}</span>;
}

function SidebarNav({ panel, setPanel, view, setView }: { panel: Panel; setPanel: (panel: Panel) => void; view: ViewMode; setView: (view: ViewMode) => void }) {
  const nav = [
    { id: "workspace" as const, label: "Arbeitsbereich", icon: Activity },
    { id: "security" as const, label: "Sicherheitsarchitektur", icon: ShieldCheck },
    { id: "audit" as const, label: "Audit & Nachweise", icon: ClipboardCheck },
  ];
  return <aside className="hidden w-[282px] shrink-0 border-r border-[#dbe3de] bg-[#102c36] text-white lg:flex lg:flex-col">
    <div className="border-b border-white/10 px-7 py-7">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#dfeade] text-[#0d6f6a]"><ShieldCheck className="h-5 w-5" /></div>
        <div><p className="font-serif text-xl leading-none">TaxSecure</p><p className="mt-1 text-[10px] font-bold tracking-[.18em] text-[#a9c9c3]">CLIENT PORTAL</p></div>
      </div>
    </div>
    <div className="px-4 py-5">
      <p className="px-3 pb-2 text-[10px] font-bold tracking-[.16em] text-white/40">PORTAL-ANSICHT</p>
      <div className="grid grid-cols-2 rounded-xl bg-white/7 p-1">
        <button onClick={() => setView("client")} className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${view === "client" ? "bg-white text-[#102c36]" : "text-white/60 hover:text-white"}`}>Mandant</button>
        <button onClick={() => setView("firm")} className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${view === "firm" ? "bg-white text-[#102c36]" : "text-white/60 hover:text-white"}`}>Kanzlei</button>
      </div>
    </div>
    <nav className="flex-1 px-4">
      <p className="px-3 pb-2 text-[10px] font-bold tracking-[.16em] text-white/40">BEREICHE</p>
      <div className="space-y-1">
        {nav.map(item => <button key={item.id} onClick={() => setPanel(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${panel === item.id ? "bg-white/11 font-semibold text-white" : "text-white/60 hover:bg-white/7 hover:text-white"}`}><item.icon className="h-4 w-4" />{item.label}</button>)}
      </div>
    </nav>
    <div className="m-4 rounded-2xl border border-white/10 bg-white/6 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#dfeade]"><LockKeyhole className="h-4 w-4" /> Sicherheitsmodus aktiv</div>
      <p className="mt-2 text-xs leading-5 text-white/55">DEMO-UMGEBUNG · ausschließlich fiktive Belegdaten</p>
    </div>
  </aside>;
}

function UploadControl({ setNotice }: { setNotice: (value: string) => void }) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const acceptFile = (file?: File) => {
    if (!file) return;
    const validation = clientUploadValidation(file);
    if (!validation.accepted) {
      setError(validation.reason);
      setFileName("");
      return;
    }
    setError("");
    setFileName(file.name);
    setNotice("Datei lokal geprüft. In dieser Vorführung wird kein echter Beleg gespeichert oder verarbeitet.");
  };
  return <div className="rounded-2xl border border-dashed border-[#9bbab4] bg-[#f7fbf8] p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-[#dfeade] p-2.5 text-[#0d6f6a]"><UploadCloud className="h-5 w-5" /></div><div><p className="font-semibold text-[#102c36]">Beleg sicher einreichen</p><p className="mt-1 text-xs leading-5 text-slate-500">PDF, JPG oder PNG · maximal 10 MB · serverseitige Typ- und Größenprüfung</p></div></div>
      <label className="cursor-pointer rounded-xl bg-[#0d6f6a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a5d59] active:scale-[.97]">Datei auswählen<input className="hidden" type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => acceptFile(event.target.files?.[0])} /></label>
    </div>
    {fileName && <p className="mt-4 flex items-center gap-2 text-xs font-medium text-[#0d6f6a]"><CheckCircle2 className="h-4 w-4" /> {fileName} · lokale Vorabprüfung bestanden</p>}
    {error && <p className="mt-4 flex items-center gap-2 text-xs font-medium text-rose-700"><CircleAlert className="h-4 w-4" /> {error}</p>}
  </div>;
}

function Workspace({ view, setNotice }: { view: ViewMode; setNotice: (value: string) => void }) {
  const visibleDocs = view === "client" ? documentsVisibleToClient(demoDocuments) : demoDocuments;
  const headline = view === "client" ? "Guten Morgen, Nordlicht Beratung." : "Kanzlei-Workbench · Heute im Fokus.";
  return <div className="space-y-6 rise-in">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e8f0e7] px-3 py-1 text-[11px] font-bold tracking-[.08em] text-[#0d6f6a]"><LockKeyhole className="h-3.5 w-3.5" /> {view === "client" ? "MANDANTENBEREICH" : "KANZLEIINTERN · RBAC"}</div><h1 className="font-serif text-3xl text-[#102c36] sm:text-4xl">{headline}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{view === "client" ? "Reichen Sie Belege ein und verfolgen Sie den Bearbeitungsstand – ohne Einblick in andere Mandate." : "Prüfen Sie zugewiesene Mandantenbelege. Der Zugriff wird pro Dokument und Rolle kontrolliert."}</p></div><div className="flex items-center gap-3 rounded-2xl border border-[#dbe3de] bg-white px-4 py-3 shadow-sm"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#f6eddc] text-[#b9914b]"><Bell className="h-4 w-4" /></div><div><p className="text-xs font-semibold text-[#102c36]">2 gesicherte Übergaben</p><p className="text-[11px] text-slate-500">ohne Beleginhalt oder Anhang</p></div></div></div>
    <div className="grid gap-4 md:grid-cols-3"><Metric label={view === "client" ? "Meine Belege" : "Zugewiesene Belege"} value="03" note="aktiver Zeitraum" icon={FileText} /><Metric label="Rückfragen" value="01" note="gezielte Nachforderung" icon={CircleAlert} tone="amber" /><Metric label="Sichere Übergaben" value="02" note="metadata-only" icon={Network} tone="teal" /></div>
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,.8fr)]"><section className="card-lift overflow-hidden rounded-[1.35rem] border border-[#dbe3de] bg-white shadow-[0_7px_24px_rgba(16,44,54,.045)]"><div className="flex items-center justify-between border-b border-[#edf0ec] px-6 py-5"><div><h2 className="font-serif text-xl text-[#102c36]">Dokumentenworkflow</h2><p className="mt-1 text-xs text-slate-500">Status, Übergaben und Zugriff werden protokolliert.</p></div><button className="flex items-center gap-1 text-xs font-bold text-[#0d6f6a]">Alle anzeigen <ArrowUpRight className="h-3.5 w-3.5" /></button></div><div className="sm:hidden space-y-2 p-3">{visibleDocs.map(document => <button key={document.id} onClick={() => setNotice("Geschützte Dokumentansicht: Zugriff wird serverseitig per Rolle und Dokumentzuordnung geprüft.")} className="w-full rounded-xl border border-[#edf0ec] p-3 text-left"><div className="flex items-start gap-3"><div className="rounded-lg bg-[#f4f7f3] p-2 text-[#0d6f6a]"><FileText className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#102c36]">{document.title}</p><p className="mt-0.5 text-[11px] text-slate-400">{document.reference} · {document.submittedAt}</p><div className="mt-2"><StatusBadge status={document.status} /></div></div><ChevronRight className="mt-1 h-4 w-4 text-[#0d6f6a]" /></div></button>)}</div><div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#fbfcfa] text-[10px] font-bold tracking-[.12em] text-slate-400"><tr><th className="px-6 py-3">BELEG</th><th className="px-4 py-3">EINGEREICHT</th><th className="px-4 py-3">STATUS</th><th className="px-6 py-3 text-right">ZUGRIFF</th></tr></thead><tbody>{visibleDocs.map(document => <tr key={document.id} className="border-t border-[#edf0ec] text-sm"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-[#f4f7f3] p-2 text-[#0d6f6a]"><FileText className="h-4 w-4" /></div><div><p className="font-semibold text-[#102c36]">{document.title}</p><p className="mt-0.5 text-xs text-slate-400">{document.reference} · {document.category}</p></div></div></td><td className="px-4 py-4 text-xs text-slate-500">{document.submittedAt}</td><td className="px-4 py-4"><StatusBadge status={document.status} /></td><td className="px-6 py-4 text-right"><button onClick={() => setNotice("Geschützte Dokumentansicht: Zugriff wird serverseitig per Rolle und Dokumentzuordnung geprüft.")} className="inline-flex items-center gap-1 text-xs font-bold text-[#0d6f6a]">Öffnen <ChevronRight className="h-3.5 w-3.5" /></button></td></tr>)}</tbody></table></div></section>
    <aside className="space-y-5"><UploadControl setNotice={setNotice} /><div className="rounded-[1.35rem] bg-[#102c36] p-6 text-white shadow-[0_10px_30px_rgba(16,44,54,.16)]"><div className="flex items-center justify-between"><div className="rounded-xl bg-white/10 p-2.5 text-[#dfeade]"><Link2 className="h-5 w-5" /></div><span className="rounded-full bg-[#dfeade]/12 px-2.5 py-1 text-[10px] font-bold tracking-[.1em] text-[#dfeade]">TEAMS HANDOFF</span></div><h3 className="mt-5 font-serif text-xl">Sicher informiert.<br />Inhalte bleiben im Portal.</h3><div className="mt-5 rounded-xl border border-white/10 bg-white/6 p-4 font-mono text-[11px] leading-6 text-[#dfeade]"><span className="text-white/45">event</span>: review_requested<br /><span className="text-white/45">document_ref</span>: TS-1042<br /><span className="text-white/45">portal_link</span>: controlled<br /><span className="text-white/45">attachments</span>: 0<br /><span className="text-white/45">contents</span>: never sent</div><p className="mt-4 text-xs leading-5 text-white/55">Die Teams-Integration ist bewusst simuliert. In Produktion erfolgt sie ausschließlich serverseitig über Microsoft Graph oder einen freigegebenen Webhook.</p></div></aside></div>
  </div>;
}

function Metric({ label, value, note, icon: Icon, tone = "default" }: { label: string; value: string; note: string; icon: typeof FileText; tone?: "default" | "amber" | "teal" }) {
  const palette = tone === "amber" ? "bg-[#f6eddc] text-[#9a702e]" : tone === "teal" ? "bg-[#dfeade] text-[#0d6f6a]" : "bg-[#e8eef0] text-[#426a74]";
  return <div className="card-lift rounded-2xl border border-[#dbe3de] bg-white p-5 shadow-[0_7px_24px_rgba(16,44,54,.04)]"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-3 font-serif text-3xl text-[#102c36]">{value}</p><p className="mt-1 text-[11px] text-slate-400">{note}</p></div><div className={`rounded-xl p-2.5 ${palette}`}><Icon className="h-5 w-5" /></div></div></div>;
}

function SecurityView() {
  const layers = [
    { title: "Identity & Access", text: "Entra ID, MFA und kontextbezogene Sitzungen. RBAC trennt Mandant, Sachbearbeitung und Kanzlei-Administration.", icon: KeyRound, tag: "AUTHENTICATED" },
    { title: "Secure Document Plane", text: "Servervalidierung, verschlüsselte Speicherreferenzen und dokumentbezogene Autorisierung vor jeder geschützten Ansicht.", icon: FileLock2, tag: "ENCRYPTED" },
    { title: "Detection & Response", text: "Audit-Hash-Kette, Log Analytics, KQL-Detections und Incident-Response-Runbook aus dem Azure Security Lab.", icon: Activity, tag: "OBSERVABLE" },
    { title: "Zero-Cost Evidence", text: "Terraform-Referenz, GitHub-OIDC-Nachweis und CI-Guardrails prüfen Azure-Kontrollen. Der Cost Gate bleibt standardmäßig geschlossen.", icon: ServerCog, tag: "NO APPLY" },
    { title: "Zero Trust Access", text: "Das Portal ist ein ZPA-Applikationssegment: nur 443, kein Bypass, Zugriff erst nach Posture-Prüfung. Der Netzwerkstandort begründet nie Vertrauen.", icon: Network, tag: "NO IMPLICIT TRUST" },
  ];
  return <div className="space-y-6 rise-in"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e8f0e7] px-3 py-1 text-[11px] font-bold tracking-[.08em] text-[#0d6f6a]"><ShieldCheck className="h-3.5 w-3.5" /> ARCHITEKTUR & KONTROLLEN</div><h1 className="font-serif text-3xl text-[#102c36] sm:text-4xl">Trust by design.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">TaxSecure überträgt die Kontrollen des Secure Azure Workload Lab auf einen realistischen Kanzlei-Workflow. Das Portal zeigt die Sicherheitsgrenze, nicht nur ein schönes Interface.</p></div><div className="rounded-[1.5rem] border border-[#dbe3de] bg-white p-5 shadow-[0_7px_24px_rgba(16,44,54,.04)] sm:p-8"><div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]"><ArchitectureBlock label="Trust zone 01" title="Identity" body="Entra ID · MFA · RBAC" icon={UsersRound} /><Connector /><ArchitectureBlock label="Trust zone 02" title="Portal" body="TLS · server-side policy · audit" icon={ServerCog} /><Connector /><ArchitectureBlock label="Trust zone 03" title="Data plane" body="Key Vault · encrypted storage · logs" icon={Database} /></div><div className="my-7 h-px bg-[#e8eeea]" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{layers.map(layer => <div key={layer.title} className="rounded-2xl bg-[#f8faf7] p-5"><div className="flex items-center justify-between"><layer.icon className="h-5 w-5 text-[#0d6f6a]" /><span className="text-[9px] font-bold tracking-[.14em] text-[#0d6f6a]">{layer.tag}</span></div><h3 className="mt-5 font-serif text-lg text-[#102c36]">{layer.title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{layer.text}</p></div>)}</div></div><div className="rounded-2xl border border-[#d4e2dc] bg-[#f7fbf8] p-5"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0d6f6a]" /><div><p className="font-semibold text-[#24534f]">Kostenbremse als technische Kontrolle</p><p className="mt-1 text-sm leading-6 text-[#4b716d]">Die Azure-Terraform-Referenz ist standardmäßig auf <span className="font-mono text-xs">enable_deployment = false</span> gesperrt. CI prüft TLS, private Netzgrenzen, Key-Vault-RBAC, Storage-Logging und GitHub-OIDC ohne eine Azure-Ressource zu erstellen.</p></div></div></div><div className="rounded-2xl border border-[#e6d7b9] bg-[#fffcf5] p-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#b9914b]" /><div><p className="font-semibold text-[#6e5429]">Integrationsgrenze klar dokumentiert</p><p className="mt-1 text-sm leading-6 text-[#7d6946]">Diese Web-App kann nicht auf persönliche MCP-Tools zugreifen. Eine echte Teams-Anbindung verwendet später ausschließlich serverseitig konfigurierte Microsoft-Graph- oder Teams-Webhook-Credentials, geschützt durch Key Vault und Tenant Consent.</p></div></div></div></div>;
}

function ArchitectureBlock({ label, title, body, icon: Icon }: { label: string; title: string; body: string; icon: typeof UsersRound }) { return <div className="rounded-2xl border border-[#dbe3de] bg-white p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-bold tracking-[.12em] text-slate-400">{label}</span><Icon className="h-5 w-5 text-[#0d6f6a]" /></div><h3 className="mt-8 font-serif text-xl text-[#102c36]">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{body}</p></div>; }
function Connector() { return <div className="hidden items-center justify-center lg:flex"><div className="h-px w-8 bg-[#b9cec8]" /><ChevronRight className="-ml-1 h-4 w-4 text-[#0d6f6a]" /></div>; }

function AuditView() { return <div className="space-y-6 rise-in"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e8f0e7] px-3 py-1 text-[11px] font-bold tracking-[.08em] text-[#0d6f6a]"><ClipboardCheck className="h-3.5 w-3.5" /> REVISIONSFÄHIGE NACHWEISE</div><h1 className="font-serif text-3xl text-[#102c36] sm:text-4xl">Jede Übergabe bleibt nachvollziehbar.</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">Der Audit-Trail protokolliert Metadaten und kryptografische Prüfreferenzen, nicht die Inhalte der Belege. Jede neue Zeile referenziert den vorherigen Hash.</p></div><div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(330px,.8fr)]"><section className="rounded-[1.4rem] border border-[#dbe3de] bg-white p-6 shadow-[0_7px_24px_rgba(16,44,54,.04)]"><div className="flex items-center justify-between"><div><h2 className="font-serif text-xl text-[#102c36]">Aktueller Evidenzpfad</h2><p className="mt-1 text-xs text-slate-500">TS-1042 · keine Beleginhalte im Protokoll</p></div><span className="rounded-full bg-[#e8f0e7] px-3 py-1 text-[10px] font-bold tracking-[.1em] text-[#0d6f6a]">CHAIN INTACT</span></div><div className="mt-7 space-y-0">{auditPreview.map((event, index) => <div key={event.event} className="relative flex gap-4 pb-6 last:pb-0"><div className="flex w-9 shrink-0 flex-col items-center"><span className={`grid h-8 w-8 place-items-center rounded-full ${event.tone === "secure" ? "bg-[#dfeade] text-[#0d6f6a]" : event.tone === "accent" ? "bg-[#f6eddc] text-[#b9914b]" : "bg-[#eef2f0] text-[#69847d]"}`}><CheckCircle2 className="h-4 w-4" /></span>{index < auditPreview.length - 1 && <span className="mt-1 h-full w-px bg-[#dbe3de]" />}</div><div className="flex-1 rounded-xl border border-[#edf0ec] px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#102c36]">{event.event}</p><span className="font-mono text-[10px] text-slate-400">{event.time}</span></div><p className="mt-1 text-xs text-slate-500">Akteur: {event.actor}</p></div></div>)}</div></section><aside className="rounded-[1.4rem] bg-[#102c36] p-6 text-white"><Database className="h-6 w-6 text-[#dfeade]" /><h3 className="mt-6 font-serif text-2xl">Manipulation erkennbar.</h3><p className="mt-3 text-sm leading-6 text-white/60">Jedes Ereignis trägt den Hash des vorherigen Eintrags. Die Prüfkette erschwert unbemerkte Änderungen und unterstützt eine strukturierte Incident Response.</p><div className="mt-7 rounded-xl border border-white/10 bg-white/6 p-4 font-mono text-[10px] leading-6 text-[#dfeade]"><p>prev_hash: 9d14…7bc2</p><p>event_hash: a81c…e24d</p><p>classification: metadata_only</p><p>retention: policy_controlled</p></div></aside></div></div>; }

export default function Home() {
  const [view, setView] = useState<ViewMode>("client");
  const [panel, setPanel] = useState<Panel>("workspace");
  const [notice, setNotice] = useState("Demo-Umgebung aktiv: keine echten Steuerdaten, keine produktive Teams-Übertragung.");
  return <div className="portal-shell grain min-h-screen"><div className="relative flex min-h-screen"><SidebarNav panel={panel} setPanel={setPanel} view={view} setView={setView} /><main className="min-w-0 flex-1"><header className="flex min-h-20 items-center justify-between border-b border-[#dbe3de] bg-[#fbfcfa]/90 px-5 backdrop-blur sm:px-9"><div className="flex items-center gap-3 lg:hidden"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#102c36] text-white"><ShieldCheck className="h-5 w-5" /></div><span className="font-serif text-xl text-[#102c36]">TaxSecure</span></div><div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><Search className="h-4 w-4" /><span>Mandantenportal · Sicherheitsdemo</span></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs font-semibold text-[#102c36]">M. Berger</p><p className="text-[10px] text-slate-400">Demo-Identität</p></div><div className="grid h-9 w-9 place-items-center rounded-full bg-[#dfeade] text-xs font-bold text-[#0d6f6a]">MB</div></div></header><div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-9 sm:py-9"><div className="mb-6 flex items-center gap-3 rounded-xl border border-[#eadfc7] bg-[#fffcf5] px-4 py-3 text-xs text-[#79643b]"><CircleAlert className="h-4 w-4 shrink-0 text-[#b9914b]" /><span className="flex-1">{notice}</span><button onClick={() => setNotice("Demo-Umgebung aktiv: keine echten Steuerdaten, keine produktive Teams-Übertragung.")} className="text-[10px] font-bold tracking-[.08em] text-[#9a7a43]">ZURÜCKSETZEN</button></div>{panel === "workspace" && <Workspace view={view} setNotice={setNotice} />}{panel === "security" && <SecurityView />}{panel === "audit" && <AuditView />}</div></main></div></div>;
}
