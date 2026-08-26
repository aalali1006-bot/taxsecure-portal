# Security Policy

TaxSecure Portal is a public portfolio demonstration. It must never be used to process real tax records, client invoices or production credentials.

## Reporting a vulnerability

Please do not open a public issue with exploit details, credentials, personal data or document content. Instead, contact the repository owner privately through GitHub and include a concise description, affected path and safe reproduction steps. Acknowledgement and remediation priority depend on the impact on access control, document confidentiality, integration boundaries or audit integrity.

## Security boundaries

The demo accepts only fictional documents. The Microsoft Teams behavior is simulated and deliberately sends no invoice content or attachments. A production deployment needs a security review, tenant-specific identity configuration, server-side secrets, encrypted storage controls, retention policy, monitoring and incident response procedures.
