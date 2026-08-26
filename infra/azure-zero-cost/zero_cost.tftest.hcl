mock_provider "azurerm" {}

run "zero_cost_default_creates_no_azure_resources" {
  command = plan

  variables {
    enable_deployment = false
  }

  assert {
    condition     = output.deployment_mode == "zero-cost-security-lab"
    error_message = "The default mode must stay non-deploying."
  }

  assert {
    condition     = length(azurerm_resource_group.security_lab) == 0
    error_message = "No Azure resource group may be planned in zero-cost mode."
  }

  assert {
    condition     = length(azurerm_storage_account.secure_documents) == 0
    error_message = "No storage account may be planned in zero-cost mode."
  }
}
