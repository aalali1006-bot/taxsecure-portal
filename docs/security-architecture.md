# Security Architecture Mapping

The portal expresses the same control layers as the Secure Azure Workload Lab. It is an application-level demonstration, not a production tax-processing service.

| Control plane | Portal behavior | Azure-lab connection |
|---|---|---|
| Network access | The portal is reached as a single published application segment after a posture-conditioned decision, never because of network location | Zscaler Private Access reference in `infra/zscaler-zero-trust` |
| Identity | Authenticated session and role-aware server procedures | Entra ID and least-privilege RBAC |
| Authorization | Document access requires an active firm membership or the owning client profile | Object-level authorization layered on RBAC |
| Secrets | No credential is committed or sent to the browser | Key Vault for Graph or webhook credentials |
| Storage | File bytes belong in protected object storage; the database stores only keys and metadata | Encrypted storage and controlled storage access |
| Audit | Hash-linked events cover document and integration lifecycle metadata | Log Analytics, KQL triage and evidence retention |
| Detection and response | Suspicious-access and integration events are designed for alerting and investigation | Detection queries and incident-response runbook in the Azure lab |

The audit chain is tamper-evident: each event includes the previous event hash. A production environment should additionally restrict write access, export audit evidence to an independent retention target and alert on chain-validation failures.
