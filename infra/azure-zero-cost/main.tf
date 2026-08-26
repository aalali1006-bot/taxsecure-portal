# Zero-cost default: every Azure resource is gated behind enable_deployment = false.
# This module is still validated and security-tested in CI on every pull request.

resource "azurerm_resource_group" "security_lab" {
  count    = var.enable_deployment ? 1 : 0
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_log_analytics_workspace" "security_lab" {
  count               = var.enable_deployment ? 1 : 0
  name                = "law-taxsecure-security-lab"
  location            = azurerm_resource_group.security_lab[0].location
  resource_group_name = azurerm_resource_group.security_lab[0].name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

resource "azurerm_key_vault" "security_lab" {
  count                         = var.enable_deployment ? 1 : 0
  name                          = "kv-taxsecure-seclab"
  location                      = azurerm_resource_group.security_lab[0].location
  resource_group_name           = azurerm_resource_group.security_lab[0].name
  tenant_id                     = "00000000-0000-0000-0000-000000000000"
  sku_name                      = "standard"
  rbac_authorization_enabled    = true
  purge_protection_enabled      = true
  soft_delete_retention_days    = 90
  public_network_access_enabled = false
  tags                          = var.tags

  network_acls {
    bypass         = "AzureServices"
    default_action = "Deny"
  }
}

resource "azurerm_storage_account" "secure_documents" {
  count                             = var.enable_deployment ? 1 : 0
  name                              = "sttaxsecureslab"
  resource_group_name               = azurerm_resource_group.security_lab[0].name
  location                          = azurerm_resource_group.security_lab[0].location
  account_tier                      = "Standard"
  account_replication_type          = "LRS"
  min_tls_version                   = "TLS1_2"
  https_traffic_only_enabled        = true
  public_network_access_enabled     = false
  allow_nested_items_to_be_public   = false
  shared_access_key_enabled         = false
  infrastructure_encryption_enabled = true
  tags                              = var.tags

  identity {
    type = "SystemAssigned"
  }

  blob_properties {
    versioning_enabled = true
    delete_retention_policy {
      days = 7
    }
    container_delete_retention_policy {
      days = 7
    }
  }
}

resource "azurerm_monitor_diagnostic_setting" "storage_events" {
  count                      = var.enable_deployment ? 1 : 0
  name                       = "diag-storage-security-events"
  target_resource_id         = azurerm_storage_account.secure_documents[0].id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.security_lab[0].id

  enabled_log { category = "StorageRead" }
  enabled_log { category = "StorageWrite" }
  enabled_log { category = "StorageDelete" }
  metric {
    category = "Transaction"
    enabled  = true
  }
}

check "explicit_cost_gate" {
  assert {
    condition     = var.enable_deployment == false
    error_message = "This portfolio lab defaults to zero-cost mode. Change enable_deployment only in a dedicated test subscription after budget and owner approval."
  }
}
