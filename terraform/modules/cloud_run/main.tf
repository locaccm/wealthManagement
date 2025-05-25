resource "google_cloud_run_service" "service" {
  name     = var.service_name
  location = var.region

  template {
    metadata {
      annotations = {
        "run.googleapis.com/vpc-access-connector" = var.vpc_connector
        }
    }

    spec {
      containers {
        image = "europe-west1-docker.pkg.dev/${var.project_id}/${var.repository_id}/${var.service_name}:latest"

        ports {
          container_port = 3000
        }

        dynamic "env" {
          for_each = var.env_variables
          content {
            name  = env.key
            value = env.value
          }
        }
      }

      service_account_name = var.service_account_email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}