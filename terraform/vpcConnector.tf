module "vpc_connector" {
  source         = "./modules/vpc_connector"
  name           = "locaccm-vpc-connector"
  region         = "europe-west1"
  network        = "locaccm-vpc"
  ip_cidr_range  = "10.8.0.0/28"
}
