import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = relativePath => readFileSync(resolve(root, relativePath), "utf8");
const main = read("infra/azure-zero-cost/main.tf");
const variables = read("infra/azure-zero-cost/variables.tf");
const oidcWorkflow = read(".github/workflows/azure-oidc-proof.yml");

const requiredControls = [
  [variables, /default\s*=\s*false/, "explicit zero-cost deployment gate"],
  [main, /public_network_access_enabled\s*=\s*false/g, "private network access"],
  [main, /min_tls_version\s*=\s*"TLS1_2"/, "TLS 1.2 minimum"],
  [main, /shared_access_key_enabled\s*=\s*false/, "shared key disabled"],
  [main, /allow_nested_items_to_be_public\s*=\s*false/, "public blob access disabled"],
  [main, /enable_rbac_authorization\s*=\s*true/, "Key Vault RBAC"],
  [main, /purge_protection_enabled\s*=\s*true/, "Key Vault purge protection"],
  [main, /Storage(Read|Write|Delete)/, "storage diagnostic logging"],
  [oidcWorkflow, /id-token:\s*write/, "GitHub OIDC permission"],
  [oidcWorkflow, /AZURE_CLIENT_ID/, "Azure workload identity input"],
];

for (const [source, pattern, label] of requiredControls) {
  if (!pattern.test(source)) {
    throw new Error(`Azure guardrail missing: ${label}`);
  }
}

if (/client_secret|AZURE_CLIENT_SECRET/i.test(oidcWorkflow)) {
  throw new Error("Azure OIDC workflow must not use a client secret.");
}

console.log(`Azure guardrails verified: ${requiredControls.length} controls, no client secret.`);
