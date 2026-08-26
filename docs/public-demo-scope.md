# Public Demo Scope

TaxSecure Portal is a recruitment portfolio demonstration. Every visible company, document, reference, workflow event and audit entry is fictional and must remain so. The application is deliberately not presented as a production tax-processing platform.

## Safe publication controls

| Area | Public demo rule |
|---|---|
| Documents | Use only fictional names, references and content-free metadata. |
| Credentials | Keep all secrets server-side; never commit `.env` files, OAuth secrets, webhook URLs or access tokens. |
| Teams | Demonstrate only a metadata-only handoff. Do not publish attachments, invoice data or a real notification endpoint. |
| Storage | The database stores references; protected retrieval is enforced through authenticated server logic. |
| Claims | Describe the hash chain as tamper-evident and combine it with restricted access and independent retention in a production design. |

This repository includes automated type, test, dependency-advisory, CodeQL and high-confidence secret checks. Repository branch protection and GitHub security alerts should be enabled in the repository settings after the public repository has been created.
