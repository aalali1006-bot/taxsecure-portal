output "deployment_mode" {
  description = "Shows that the committed default is a non-deploying security-lab mode."
  value       = var.enable_deployment ? "explicit-test-deployment" : "zero-cost-security-lab"
}

output "security_controls" {
  description = "Controls asserted by Terraform configuration and CI guardrails."
  value = [
    "private-network-only-storage",
    "tls-1.2-or-higher",
    "no-shared-storage-keys",
    "key-vault-rbac-and-purge-protection",
    "storage-diagnostic-logging",
    "github-oidc-ready-without-client-secret",
  ]
}
