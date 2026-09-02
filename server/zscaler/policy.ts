export const ALLOWED_POSTURE_STATES = new Set(["compliant", "compliant_with_warnings"]);
export const MAX_REAUTH_AGE_SECONDS = 3600;

export type DevicePosture = "compliant" | "compliant_with_warnings" | "non_compliant" | "unknown";
export type NetworkOrigin = "corporate_network" | "public_internet" | "unmanaged_vpn";
export type ZeroTrustRole = "client" | "caseworker" | "firm_admin";

export type ZeroTrustDecision = {
  allowed: boolean;
  reason: string;
};

/**
 * Mirrors the ZPA access rule in infra/zscaler-zero-trust: the portal segment is
 * granted per identity and device posture. The network the request comes from is
 * recorded, never rewarded.
 */
export function evaluateZeroTrustAccess(input: {
  role: ZeroTrustRole;
  devicePosture: DevicePosture;
  networkOrigin: NetworkOrigin;
  reauthenticatedSecondsAgo: number;
}): ZeroTrustDecision {
  if (!ALLOWED_POSTURE_STATES.has(input.devicePosture)) {
    return { allowed: false, reason: "Gerätezustand erfüllt die Posture-Anforderung nicht." };
  }
  if (input.reauthenticatedSecondsAgo < 0 || input.reauthenticatedSecondsAgo > MAX_REAUTH_AGE_SECONDS) {
    return { allowed: false, reason: "Sitzung ist zu alt; erneute Authentifizierung erforderlich." };
  }
  return { allowed: true, reason: "Zugriff auf das Portalsegment nach Identitäts- und Posture-Prüfung." };
}

/**
 * Guard against a later reintroduction of location-based trust. Any policy that
 * treats a network origin as sufficient evidence must fail loudly.
 */
export function assertNoImplicitNetworkTrust(policy: { grantsAccessBecauseOfNetwork?: boolean }) {
  if (policy.grantsAccessBecauseOfNetwork) {
    throw new Error("Netzwerkstandort darf keinen Zugriff begründen; Zero Trust erlaubt kein implizites Vertrauen.");
  }
}

/**
 * The portal is one segment. A role never widens the reachable surface, it only
 * changes what the application authorises afterwards.
 */
export function resolvePortalSegment(role: ZeroTrustRole) {
  return {
    segment: "app-taxsecure-portal",
    port: 443,
    role,
  };
}
