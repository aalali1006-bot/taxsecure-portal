# Zscaler Zero Trust Access Evidence

## Why this exists next to the Azure lab

The Azure security lab answers what happens to a document once it is inside the portal: how it is stored, encrypted, logged and retained. It does not answer how a user reaches the portal at all. That question belongs to the network and access layer, and answering it with "the user is on the company network" is exactly the assumption zero trust removes.

`infra/zscaler-zero-trust` closes that gap with the same discipline as the Azure module: real Zscaler Private Access resource definitions, a committed change gate that creates nothing, and CI that rejects a weakened control.

## What is real today

| Evidence | What a reviewer can inspect | Tenant impact |
|---|---|---:|
| ZPA resource definitions | Segment group, application segment, access policy rule and timeout rule with hardened properties | None in committed default mode |
| Change gate | Every resource uses `enable_deployment`; the default is `false`, and a `check` block fails the run if it is opened | None |
| Mocked plan test | `terraform test` proves the committed default plans zero Zscaler objects | None |
| CI guardrails | Formatting, initialization, validation, the mocked plan test, and static checks for bypass, ICMP, port scope, double encryption, posture condition and re-authentication | Free on public-repository runners |
| Credential hygiene | Every provider value is a variable defaulting to an empty string; the guardrail script fails on any literal credential | No tenant secret exists |

> This is deliberately more honest than claiming a licensed Zscaler tenant. The plan test proves the committed default touches nothing, while the configuration proves how portal access would be constrained if a tenant becomes available.

## Controls and why they matter

| Control | Configuration | What it prevents |
|---|---|---|
| Application segment, not a network range | `zpa_application_segment` for one FQDN | Lateral movement to neighbouring systems once a client is connected |
| Port scope | TCP 443 only | Management ports and side channels riding along with the published app |
| No bypass | `bypass_type = "NEVER"` | A traffic path that skips the policy decision entirely |
| No ICMP | `icmp_access_type = "NONE"` | Discovery and reachability probing of the segment |
| Double encryption | `double_encrypt = true` | Sole reliance on the application's own TLS termination |
| Posture condition | `POSTURE` operand on the access rule | Access from an unmanaged or non-compliant device |
| Short re-authentication | `reauth_timeout = 3600`, `reauth_idle_timeout = 600` | Indefinitely valid sessions after a device changes state |

The server mirrors the same decision in `server/zscaler/policy.ts` so the rule is testable without a tenant. `evaluateZeroTrustAccess` denies a non-compliant device **even when the request originates from the corporate network**, and `assertNoImplicitNetworkTrust` fails loudly if a future policy reintroduces location-based trust.

## Activation only when a tenant exists

1. Use an isolated Zscaler test tenant; confirm licensing and an owner before changing `enable_deployment`.
2. Create OneAPI credentials and supply `zscaler_client_id`, `zscaler_client_secret`, `zscaler_vanity_domain` and `zpa_customer_id` as variables from a secret store — never as committed values.
3. Create the device posture profile in the Zscaler console and pass its identifier as `posture_profile_id`. This module references a posture profile, it does not create one.
4. Open a separate pull request for the gate change so the guardrail diff is reviewable on its own.
5. Only then run a plan against the test tenant. No workflow in this repository runs `terraform apply`.

## Boundary

No runtime call from the portal to Zscaler exists, and none is planned in this mode. The application does not query ZPA, does not hold tenant credentials and does not depend on Zscaler being reachable. The module and the policy functions are a design and verification artefact.

## References

[1] [Zscaler ZPA Terraform provider](https://registry.terraform.io/providers/zscaler/zpa/latest/docs) — official provider documentation for the resources used in this module.

[2] [NIST SP 800-207, Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) — defines the tenets applied here: per-session access decisions, no trust based on network location, and device posture as an input to the decision.

[3] [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) — standard GitHub-hosted runners are free for public repositories.
