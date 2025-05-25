
variable "name" {
  description = "Name of the VPC connector"
  type        = string
}

variable "region" {
  description = "Region of the VPC connector"
  type        = string
}

variable "network" {
  description = "The VPC network name"
  type        = string
}

variable "ip_cidr_range" {
  description = "CIDR range for VPC connector IPs"
  type        = string
}