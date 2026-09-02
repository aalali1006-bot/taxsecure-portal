variable "enable_deployment" {
  description = "Explicit change gate. Keep false for the tenant-free zero-trust reference mode."
  type        = bool
  default     = false
}

variable "portal_domain" {
  description = "Fully qualified name of the portal published as a private application segment."
  type        = string
  default     = "portal.taxsecure.example"
}

variable "posture_profile_id" {
  description = "Device posture profile the access rule requires. Referenced, never created by this module."
  type        = string
  default     = ""
}

variable "zscaler_client_id" {
  description = "OneAPI client id. Empty by default; supplied only for an isolated tenant test."
  type        = string
  default     = ""
}

variable "zscaler_client_secret" {
  description = "OneAPI client secret. Empty by default and never committed."
  type        = string
  default     = ""
  sensitive   = true
}

variable "zscaler_vanity_domain" {
  description = "Zscaler vanity domain used by the OneAPI authentication framework."
  type        = string
  default     = ""
}

variable "zpa_customer_id" {
  description = "ZPA customer id used only when a tenant test is explicitly approved."
  type        = string
  default     = ""
}
