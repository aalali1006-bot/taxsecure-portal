terraform {
  required_version = ">= 1.9.0"

  required_providers {
    zpa = {
      source  = "zscaler/zpa"
      version = "~> 4.0"
    }
  }
}

# Zero-trust reference: no credential is ever committed. Every value stays empty
# unless a reviewer supplies it for an isolated tenant test, and the resources
# below remain gated behind enable_deployment regardless.
provider "zpa" {
  client_id     = var.zscaler_client_id
  client_secret = var.zscaler_client_secret
  vanity_domain = var.zscaler_vanity_domain
  customer_id   = var.zpa_customer_id
}
