import { describe, expect, it } from "vitest";
import {
  MAX_REAUTH_AGE_SECONDS,
  assertNoImplicitNetworkTrust,
  evaluateZeroTrustAccess,
  resolvePortalSegment,
} from "./policy";

describe("Zscaler zero-trust access policy", () => {
  it("grants the portal segment for a compliant device within the re-auth window", () => {
    const decision = evaluateZeroTrustAccess({
      role: "caseworker",
      devicePosture: "compliant",
      networkOrigin: "public_internet",
      reauthenticatedSecondsAgo: 120,
    });
    expect(decision.allowed).toBe(true);
  });

  it("denies a non-compliant device even from the corporate network", () => {
    const decision = evaluateZeroTrustAccess({
      role: "firm_admin",
      devicePosture: "non_compliant",
      networkOrigin: "corporate_network",
      reauthenticatedSecondsAgo: 5,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/Posture/);
  });

  it("forces re-authentication once the session exceeds the timeout window", () => {
    const decision = evaluateZeroTrustAccess({
      role: "client",
      devicePosture: "compliant",
      networkOrigin: "public_internet",
      reauthenticatedSecondsAgo: MAX_REAUTH_AGE_SECONDS + 1,
    });
    expect(decision.allowed).toBe(false);
  });

  it("rejects any policy that grants access because of the network location", () => {
    expect(() => assertNoImplicitNetworkTrust({ grantsAccessBecauseOfNetwork: true })).toThrow();
    expect(() => assertNoImplicitNetworkTrust({})).not.toThrow();
  });

  it("exposes one portal segment on 443 regardless of role", () => {
    expect(resolvePortalSegment("client")).toMatchObject({ segment: "app-taxsecure-portal", port: 443 });
    expect(resolvePortalSegment("firm_admin")).toMatchObject({ segment: "app-taxsecure-portal", port: 443 });
  });
});
