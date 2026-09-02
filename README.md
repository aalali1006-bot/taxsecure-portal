# TaxSecure Portal

TaxSecure Portal is a security-focused client portal demonstration for tax advisory firms. It is designed as a companion project to the Secure Azure Workload Lab and shows how secure document exchange, least-privilege access, workflow traceability and data-minimised collaboration can be presented in a polished product experience.

## Demonstrated security controls

| Domain | Demonstration |
|---|---|
| Identity and access | Role separation for clients, caseworkers and firm administrators; protected document retrieval enforces a firm membership or an owning client profile. |
| Document intake | The server allows only PDF, JPG and PNG, checks the file size against a 10 MB boundary, validates filenames, and stores only storage references in the database. |
| Workflow | Documents move through `submitted`, `under_review`, `query` and `completed`. Client permissions are limited to responding to an existing query. |
| Auditability | Uploads, protected accesses, status changes and integration events are recorded in a hash-linked evidence chain without document content. |
| Teams boundary | The demonstrated handoff contains only the workflow event, document reference and controlled portal URL. Invoice content, attachments, banking data and tax identifiers are deliberately excluded. |
| Azure mapping | The architecture view maps Entra ID, RBAC, Key Vault, encrypted storage, logging, detection and incident response to the existing Azure lab. |
| Zero-cost Azure evidence | A non-deploying AzureRM Terraform reference, GitHub OIDC proof gate and mandatory CI guardrails demonstrate hardened cloud design without keeping cloud resources online. |
| Zero trust access | The portal is modelled as a single Zscaler Private Access application segment reachable on 443 only, with no bypass, no ICMP and a device-posture condition. Network location never grants access. |

## Demo scope and privacy

The visible sample documents are explicitly fictional and labelled as demonstration data. No real tax data is seeded, recorded or transmitted. The user interface offers a local upload validation preview; authenticated server routes provide the actual validation, storage and audit logic.

## Integration boundary

This browser application cannot access personal MCP tools. The Teams handoff is intentionally simulated. A production integration would make a server-side Microsoft Graph or approved Teams webhook call only after tenant consent and credentials have been configured. Such credentials belong in Key Vault or an equivalent server-side secret store and must never be exposed to the client.

| Future approach | Trade-off | Cost | Setup complexity |
|---|---|---:|---|
| Microsoft Graph from the server | Strong tenant control, granular permissions and an auditable enterprise path | Microsoft tenant licensing dependent | Higher: tenant app registration, consent and Key Vault secret management |
| Approved Teams incoming webhook from the server | Smaller payload surface for a single notification channel | Usually low | Lower: approved webhook URL stored server-side |

## Local verification

```bash
pnpm check
pnpm test
```

The unit suite verifies the upload allow-list and size boundary, workflow least privilege, and data-minimised Teams payload policy.

## Zero-cost Azure security lab

The repository contains [`infra/azure-zero-cost`](infra/azure-zero-cost): a real AzureRM configuration with a committed `enable_deployment = false` cost gate. It demonstrates private Storage, Key Vault RBAC and purge protection, diagnostic logging, GitHub OIDC readiness and policy-style guardrails. The CI workflow validates the configuration but never deploys it. See [`docs/zero-cost-azure-security.md`](docs/zero-cost-azure-security.md) for evidence and the controlled activation path.

## Zero trust access reference

[`infra/zscaler-zero-trust`](infra/zscaler-zero-trust) applies the same approach to the access layer: a real Zscaler Private Access configuration behind a committed `enable_deployment = false` change gate, so no tenant, licence or credential is required. It publishes the portal as one application segment on TCP 443 with `bypass_type = "NEVER"`, no ICMP reachability, double encryption, a device-posture condition and a short re-authentication window.

The same decision is mirrored as testable server code in `server/zscaler/policy.ts`, which denies a non-compliant device even when the request comes from the corporate network. CI runs `terraform fmt`, `validate` and a mocked-provider plan test that proves the committed default creates nothing, plus `scripts/verify-zscaler-guardrails.mjs`, which fails if any control is weakened or a credential is committed. See [`docs/zscaler-zero-trust.md`](docs/zscaler-zero-trust.md) for the evidence table and the controlled activation path.
