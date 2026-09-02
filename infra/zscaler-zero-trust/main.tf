# Tenant-free default: every ZPA resource is gated behind enable_deployment = false.
# The module is still formatted, validated and security-tested in CI on every pull request.
#
# The control this expresses: the portal is reachable as one named application
# segment behind an authorization decision, never because a client sits on a
# trusted network. Nothing here grants access by location.

resource "zpa_app_connector_group" "portal" {
  count                    = var.enable_deployment ? 1 : 0
  name                     = "acg-taxsecure-portal"
  description              = "Connector group fronting the TaxSecure portal segment."
  enabled                  = true
  city_country             = "Hamburg, DE"
  country_code             = "DE"
  latitude                 = "53.5511"
  longitude                = "9.9937"
  location                 = "Hamburg, DE"
  upgrade_day              = "SUNDAY"
  upgrade_time_in_secs     = "66600"
  override_version_profile = true
  version_profile_id       = 0
  dns_query_type           = "IPV4"
}

resource "zpa_server_group" "portal" {
  count             = var.enable_deployment ? 1 : 0
  name              = "sg-taxsecure-portal"
  description       = "Server group for the portal segment; discovery stays dynamic."
  enabled           = true
  dynamic_discovery = true

  app_connector_groups {
    id = [zpa_app_connector_group.portal[0].id]
  }
}

resource "zpa_segment_group" "portal" {
  count       = var.enable_deployment ? 1 : 0
  name        = "seg-taxsecure-portal"
  description = "Groups the portal as its own segment instead of a routable network range."
  enabled     = true
}

resource "zpa_application_segment" "portal" {
  count            = var.enable_deployment ? 1 : 0
  name             = "app-taxsecure-portal"
  description      = "TaxSecure client portal published as a private application."
  enabled          = true
  domain_names     = [var.portal_domain]
  segment_group_id = zpa_segment_group.portal[0].id

  # No plaintext fallback, no bypass, no ICMP reachability, no lateral discovery.
  double_encrypt   = true
  bypass_type      = "NEVER"
  bypass_on_reauth = false
  icmp_access_type = "NONE"
  is_cname_enabled = true
  health_reporting = "CONTINUOUS"
  ip_anchored      = false

  tcp_port_range = [
    {
      from = "443"
      to   = "443"
    }
  ]

  server_groups {
    id = [zpa_server_group.portal[0].id]
  }
}

resource "zpa_policy_access_rule" "portal_access" {
  count       = var.enable_deployment ? 1 : 0
  name        = "taxsecure-portal-access"
  description = "Allows the portal segment only for a compliant device posture."
  action      = "ALLOW"
  operator    = "AND"

  conditions {
    operator = "OR"
    operands {
      object_type = "APP"
      lhs         = "id"
      rhs         = zpa_application_segment.portal[0].id
    }
  }

  conditions {
    operator = "OR"
    operands {
      object_type = "POSTURE"
      lhs         = var.posture_profile_id
      rhs         = "true"
    }
  }
}

resource "zpa_policy_timeout_rule" "portal_reauth" {
  count               = var.enable_deployment ? 1 : 0
  name                = "taxsecure-portal-reauth"
  description         = "Short re-authentication window instead of a long-lived session."
  action              = "RE_AUTH"
  operator            = "AND"
  reauth_idle_timeout = "600"
  reauth_timeout      = "3600"

  conditions {
    operator = "OR"
    operands {
      object_type = "APP"
      lhs         = "id"
      rhs         = zpa_application_segment.portal[0].id
    }
  }
}

check "explicit_change_gate" {
  assert {
    condition     = var.enable_deployment == false
    error_message = "This portfolio reference defaults to tenant-free mode. Change enable_deployment only against an isolated Zscaler test tenant after owner approval."
  }
}
