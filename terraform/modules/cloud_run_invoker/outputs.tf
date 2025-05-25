output "applied_invokers" {
  value = [for sa in var.invokers : sa]
}