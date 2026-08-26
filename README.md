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



## Demo scope and privacy



The visible sample documents are explicitly fictional and labelled as demonstration data. No real tax data is seeded, recorded or transmitted. The user interface offers a local upload validation preview; authenticated server routes provide the actual validation, storage and audit logic.



## Integration boundary



This browser application cannot access personal MCP tools. The Teams handoff is intentionally simulated. A production integration would make a server-side Microsoft Graph or approved Teams webhook call only after tenant consent and credentials have been configured. Such credentials belong in Key Vault or an equivalent server-side secret store and must never be exposed to the client.



## Local verification



```bash

pnpm check

pnpm test

pnpm security:check

pnpm build

```



The unit suite verifies the upload allow-list and size boundary, workflow least privilege, and data-minimised Teams payload policy.
