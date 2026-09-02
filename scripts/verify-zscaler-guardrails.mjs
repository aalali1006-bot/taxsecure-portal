import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = relativePath => readFileSync(resolve(root, relativePath), "utf8");
const main = read("infra/zscaler-zero-trust/main.tf");
const variables = read("infra/zscaler-zero-trust/variables.tf");
const versions = read("infra/zscaler-zero-trust/versions.tf");
const securityWorkflow = read(".github/workflows/zscaler-security.yml");

const requiredControls = [
  [variables, /variable\s+"enable_deployment"[\s\S]*?default\s*=\s*false/, "explicit tenant-free change gate"],
  [main, /check\s+"explicit_change_gate"/, "change gate assertion block"],
  [main, /resource\s+"zpa_application_segment"/, "portal published as an application segment"],
  [main, /bypass_type\s*=\s*"NEVER"/, "no policy bypass"],
  [main, /double_encrypt\s*=\s*true/, "double encryption"],
  [main, /icmp_access_type\s*=\s*"NONE"/, "no ICMP reachability"],
  [main, /from\s*=\s*"443"[\s\S]{0,80}?to\s*=\s*"443"/, "TCP 443 only"],
  [main, /resource\s+"zpa_policy_access_rule"[\s\S]*?action\s*=\s*"ALLOW"/, "explicit allow rule"],
  [main, /object_type\s*=\s*"POSTURE"/, "device posture condition"],
  [main, /resource\s+"zpa_policy_timeout_rule"[\s\S]*?action\s*=\s*"RE_AUTH"/, "forced re-authentication"],
  [versions, /source\s*=\s*"zscaler\/zpa"/, "official Zscaler ZPA provider"],
  [securityWorkflow, /terraform\s+-chdir=infra\/zscaler-zero-trust\s+test/, "mocked plan test in CI"],
];

for (const [source, pattern, label] of requiredControls) {
  if (!pattern.test(source)) {
    throw new Error(`Zscaler guardrail missing: ${label}`);
  }
}

// Every ZPA resource must stay behind the deployment gate. A resource without a
// count expression would create tenant objects the moment credentials exist.
const gatedResources = main.match(/resource\s+"zpa_[a-z_]+"\s+"[a-z_]+"\s*\{[\s\S]*?\n\}/g) ?? [];
if (gatedResources.length === 0) {
  throw new Error("Zscaler guardrail missing: no ZPA resource found to verify.");
}
for (const block of gatedResources) {
  if (!/count\s*=\s*var\.enable_deployment\s*\?\s*1\s*:\s*0/.test(block)) {
    const name = block.match(/resource\s+"(zpa_[a-z_]+)"\s+"([a-z_]+)"/);
    throw new Error(`Zscaler guardrail missing: ${name?.[1]}.${name?.[2]} is not behind the deployment gate.`);
  }
}

// No tenant credential may ever be committed: provider values must come from
// variables, and every credential variable must default to an empty string.
if (/(client_secret|client_id|customer_id|vanity_domain)\s*=\s*"(?!")/.test(versions)) {
  throw new Error("Zscaler provider must not contain literal tenant credentials.");
}
for (const credential of ["zscaler_client_id", "zscaler_client_secret", "zscaler_vanity_domain", "zpa_customer_id"]) {
  const declaration = variables.match(new RegExp(`variable\\s+"${credential}"[\\s\\S]*?\\n\\}`));
  if (!declaration) {
    throw new Error(`Zscaler guardrail missing: credential variable ${credential} is not declared.`);
  }
  if (!/default\s*=\s*""/.test(declaration[0])) {
    throw new Error(`Zscaler credential variable ${credential} must default to an empty string.`);
  }
}

if (/terraform\s+(-chdir=\S+\s+)?apply/.test(securityWorkflow)) {
  throw new Error("Zscaler security workflow must never run terraform apply.");
}

console.log(
  `Zscaler zero-trust guardrails verified: ${requiredControls.length} controls, ${gatedResources.length} gated resources, no tenant credential.`,
);
