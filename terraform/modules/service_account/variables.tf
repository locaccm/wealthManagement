variable "account_id" {
  description = "ID of the service account (unique)"
  type        = string
}

variable "display_name" {
  description = "Display name of the service account"
  type        = string
}

variable "project_id" {
  description = "Project ID where the service account is created"
  type        = string
}

variable "roles" {
  description = "List of IAM roles to assign to this service account"
  type        = list(string)
}
