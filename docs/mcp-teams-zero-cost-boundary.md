# Teams and MCP: Zero-Cost Security Boundary

TaxSecure does not expose personal MCP tools to the browser and does not send any invoice payload to Teams. In zero-cost mode, the implementation demonstrates the allowed contract and the later real-integration gate.

| Layer | Allowed in zero-cost mode | Forbidden in every mode |
|---|---|---|
| Browser | Display fictional workflow status and a simulated metadata-only handoff | Personal MCP access, Graph tokens, webhook URLs, invoice bytes |
| Server | Validate a minimal notification contract and record an audit event | Passing invoice content, attachments, tax IDs or banking data to Teams/MCP |
| MCP automation | Document a future allow-list: identity proof and status check only | Autonomous document export, financial-data retrieval, account changes |
| Teams / Graph | Prepare the server-side contract and test-tenant prerequisite | A production tenant or real recipient without an eligible test tenant and consent |

When an eligible Microsoft 365 developer tenant is available, the same contract can be implemented as a Microsoft Graph application permission flow. It must remain server-side, use least-privilege permissions and retain the metadata-only validation before every outbound request.
