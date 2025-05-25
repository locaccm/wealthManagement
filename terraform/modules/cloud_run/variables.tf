variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  description = "GCP region"
}

variable "service_name" {
  type        = string
  description = "Name of the Cloud Run service"
}

variable "repository_id" {
  type        = string
  description = "Artifact Registry Docker repository ID"
}

variable "service_account_email" {
  type        = string
  description = "Email of the service account to run the Cloud Run service"
}

variable "vpc_connector" {
  type        = string
  description = "Fully qualified name of the VPC connector"
}

variable "public" {
  type        = bool
  default     = false
  description = "Whether to make the Cloud Run service public"
}

variable "env_variables" {
  type        = map(string)
  default     = {}
  description = "Environment variables to inject into the container"
}
