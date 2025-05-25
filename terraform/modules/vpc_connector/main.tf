resource "google_vpc_access_connector" "this" {
  name           = var.name
  region         = var.region
  network        = var.network
  ip_cidr_range  = var.ip_cidr_range

  min_throughput = 200
  max_throughput = 300
}
