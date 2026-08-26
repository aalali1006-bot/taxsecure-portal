# Teams Integration Boundary

TaxSecure is intentionally designed so that a Teams notification contains only a workflow event, a document reference and a controlled portal link. Invoice contents, images, PDF attachments, banking information and tax identifiers never cross the Teams boundary.

| Area | Demonstrated behavior | Production requirement |
|---|---|---|
| Notification payload | Metadata-only payload with `attachmentCount: 0` | Validate payload server-side before every Graph request |
| Document access | Content remains behind authenticated portal routes | Entra ID authentication and object-level authorization |
| Credentials | No Teams credentials in browser or source code | Server-side Microsoft Graph or Teams webhook credentials stored in Key Vault |
| MCP boundary | The web app cannot access personal MCP tools | Use a separately configured server-side integration only after credential review |

The current handoff is deliberately simulated. A production implementation would call Microsoft Graph or an approved Teams webhook from the server after secrets and tenant consent have been configured. No personal MCP tools are available to this web application.
