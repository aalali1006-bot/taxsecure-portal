# Zero-Cost Azure Cloud-Security Evidence

## What is real today

TaxSecure now has a real, reproducible Azure security reference in `infra/azure-zero-cost`. The configuration defines actual AzureRM resources and hardened properties, while its committed default intentionally creates **zero resources**. GitHub validates the Terraform syntax and rejects weakened controls on every relevant pull request.

| Evidence | What a reviewer can inspect | Cost impact |
|---|---|---:|
| Terraform resource definitions | Private Azure Storage, Key Vault, Log Analytics and diagnostic settings | €0 in committed default mode |
| Deployment cost gate | Every resource uses `enable_deployment`; the default is `false` | €0 |
| GitHub OIDC proof gate | An Azure workload identity can later be verified without a client secret or deployment | €0 until manually configured and run |
| CI guardrails | Terraform formatting, initialization/validation, a mocked-provider plan test, and static checks for TLS, private access, RBAC, purge protection, logging and secretless OIDC | Free for the public repository's standard runners |

> This is deliberately more honest than claiming a paid production tenant. The plan test proves that the committed default creates no Azure resources, while the configuration proves how an isolated environment would be secured if a free test subscription is available later.

## Activation only when a free test subscription exists

1. Create or use an isolated Azure test subscription; set a budget and cost alert before changing `enable_deployment`.
2. Create an Entra ID app registration with a federated credential for the GitHub repository and workflow.
3. Add `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID` as GitHub environment secrets for `azure-oidc-test`.
4. Run **Azure OIDC Proof Gate** manually with `OIDC_TEST_ONLY`. This verifies identity only; it cannot deploy resources.
5. Use a separate pull request and explicit budget approval before any test `terraform apply`.

## Why no real Teams call exists in zero-cost mode

An actual Teams notification needs an eligible Microsoft 365 tenant, application registration and consent. The portal therefore protects the same data boundary now: only event type, document reference and a controlled portal link may ever leave the portal. Invoice content, attachments, banking data and tax identifiers are prohibited.

## References

[1] [Azure free services](https://azure.microsoft.com/en-us/pricing/free-services) — Azure distinguishes free monthly quotas from metered resources and recommends cost planning.

[2] [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) — Standard GitHub-hosted runners are free for public repositories.
