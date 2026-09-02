# TaxSecure Zscaler Zero Trust Reference

This Terraform module is a **zero-trust access reference**, not a default deployment. `enable_deployment` is committed as `false`; therefore `terraform validate` and CI review the real ZPA resource definitions without touching a Zscaler tenant, consuming a licence or storing a credential.

It answers the question the Azure lab does not: how a user reaches the portal in the first place. Access is granted to one named application segment after an authorization decision — never because a client happens to sit on a trusted network.

## Controls demonstrated

| Zero-trust control | Evidence in the module |
|---|---|
| No implicit network trust | The portal is published as a `zpa_application_segment`, not as a routable range. `bypass_type = "NEVER"` leaves no path that skips the policy decision. |
| Least exposure | Only TCP 443 is reachable. `icmp_access_type = "NONE"` removes ping and traceroute reachability, so the segment cannot be probed for discovery. |
| Transport hardening | `double_encrypt = true` keeps a second encryption layer independent of the application's own TLS. |
| Device posture as a condition | `zpa_policy_access_rule` allows the segment only when the referenced posture profile evaluates to true; the profile is referenced, never created here. |
| Session hygiene | `zpa_policy_timeout_rule` forces re-authentication after 3600 s and 600 s idle instead of a long-lived session. |
| Credential hygiene | Every provider value comes from a variable that defaults to an empty string. No tenant secret exists in the repository. |
| Change control | Every resource is behind `enable_deployment = false`, and a `check` block fails the run if that gate is opened. |

## Tenant-free verification

```bash
terraform -chdir=infra/zscaler-zero-trust init -backend=false
terraform -chdir=infra/zscaler-zero-trust fmt -check
terraform -chdir=infra/zscaler-zero-trust validate
terraform -chdir=infra/zscaler-zero-trust test
node scripts/verify-zscaler-guardrails.mjs
```

`terraform test` runs `plan` against a mocked ZPA provider and asserts that the committed default plans zero Zscaler resources. The GitHub workflow performs these steps automatically on pull requests. It never runs `terraform apply`.

The gate is not decorative: setting `enable_deployment = true` makes the `explicit_change_gate` check fail with an explicit approval message before anything can be created.
