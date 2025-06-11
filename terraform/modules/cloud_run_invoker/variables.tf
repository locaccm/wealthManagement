variable "region" {
  description = "Region of the Cloud Run service"
  type        = string
}

variable "service_name" {
  description = "Name of the Cloud Run service to grant access to"
  type        = string
}

variable "invokers" {
  description = "Map of invokers (caller_id => service_account_email)"
  type        = map(string)
}