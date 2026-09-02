mock_provider "zpa" {}

run "tenant_free_default_creates_no_zpa_resources" {
  command = plan

  variables {
    enable_deployment = false
  }

  assert {
    condition     = output.deployment_mode == "zero-trust-reference"
    error_message = "The default mode must stay non-deploying."
  }

  assert {
    condition     = length(zpa_segment_group.portal) == 0
    error_message = "No segment group may be planned in tenant-free mode."
  }

  assert {
    condition     = length(zpa_application_segment.portal) == 0
    error_message = "No application segment may be planned in tenant-free mode."
  }

  assert {
    condition     = length(zpa_policy_access_rule.portal_access) == 0
    error_message = "No access policy rule may be planned in tenant-free mode."
  }

  assert {
    condition     = length(zpa_policy_timeout_rule.portal_reauth) == 0
    error_message = "No timeout policy rule may be planned in tenant-free mode."
  }
}

run "controls_are_published_for_reviewers" {
  command = plan

  variables {
    enable_deployment = false
  }

  assert {
    condition     = contains(output.zero_trust_controls, "posture-conditioned-allow-rule")
    error_message = "The posture condition must stay part of the published control list."
  }

  assert {
    condition     = contains(output.zero_trust_controls, "no-committed-tenant-credentials")
    error_message = "The credential-free promise must stay part of the published control list."
  }
}
