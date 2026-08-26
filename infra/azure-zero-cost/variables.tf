variable "enable_deployment" {
  description = "Explicit cost gate. Keep false for the free security-lab mode."
  type        = bool
  default     = false
}

variable "location" {
  description = "Azure region for a future isolated test deployment."
  type        = string
  default     = "westeurope"
}

variable "resource_group_name" {
  description = "Resource group name used only when enable_deployment is true."
  type        = string
  default     = "rg-taxsecure-security-lab"
}

variable "tags" {
  description = "Mandatory ownership and cost-allocation tags for any future test deployment."
  type        = map(string)
  default = {
    environment = "security-lab"
    project     = "taxsecure"
    data_class  = "fictional-demo-only"
    owner       = "portfolio"
  }
}
