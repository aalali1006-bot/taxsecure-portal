output "deployment_mode" {
  description = "Shows that the committed default is a non-deploying zero-trust reference mode."
  value       = var.enable_deployment ? "explicit-test-deployment" : "zero-trust-reference"
}

output "zero_trust_controls" {
  description = "Controls asserted by the Terraform configuration and the CI guardrails."
  value = [
    "application-segment-instead-of-network-range",
    "tls-443-only-no-other-ports",
    "double-encryption-enabled",
    "no-bypass-and-no-icmp-reachability",
    "posture-conditioned-allow-rule",
    "short-reauthentication-window",
    "no-committed-tenant-credentials",
  ]
}
