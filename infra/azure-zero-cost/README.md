# TaxSecure Zero-Cost Azure Security Lab

This Terraform module is a **security control reference**, not a default deployment. `enable_deployment` is committed as `false`; therefore `terraform validate` and CI review the real Azure resource definitions without creating a subscription resource or producing a cloud bill.

## Controls demonstrated

| Azure control | Evidence in the module |
|---|---|
| Least privilege and secretless CI | GitHub OIDC is prepared in `.github/workflows/azure-oidc-proof.yml`; no client secret is stored in code or workflow configuration. |
| Storage hardening | TLS 1.2, HTTPS-only transport, public-network access disabled, no shared keys, no public nested items, infrastructure encryption and versioning. |
| Secret management | Key Vault uses RBAC authorization, soft delete, purge protection, denied public network access and default-deny network ACLs. |
| Detection | Storage read/write/delete events are routed to Log Analytics through a diagnostic setting. |
| Cost control | Every paid resource is behind `enable_deployment = false`; any future test deployment must be deliberate, isolated and budget-approved. |

## Zero-cost verification

```bash
terraform -chdir=infra/azure-zero-cost init -backend=false
terraform -chdir=infra/azure-zero-cost validate
terraform -chdir=infra/azure-zero-cost test
node scripts/verify-azure-guardrails.mjs
```

`terraform test` runs a `plan` command with a mocked Azure provider and asserts that the committed default plans zero Azure resources. The GitHub workflow performs these controls automatically on pull requests. It never runs `terraform apply`.
