module "service_account_wealthmanagement-service" {
  source       = "./modules/service_account"
  account_id   = "wealthmanagement-service"
  display_name = "Wealth Management Service Account"
  project_id   = "intricate-pad-455413-f7"
  roles        = [
    "roles/cloudsql.client",
  ]
}