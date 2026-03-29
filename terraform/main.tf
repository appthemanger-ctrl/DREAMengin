# ==========================================
# DREAMengin Infrastructure as Code
# Provider: Vercel + Supabase + Cloudflare
# ==========================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  backend "local" {
    path = "terraform.tfstate"
  }
}

# ==========================================
# Variables
# ==========================================

variable "vercel_api_token" {
  description = "Vercel API token"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID (optional)"
  type        = string
  default     = null
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for DNS"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "dreamengin.com"
}

variable "supabase_project_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment (production, staging, development)"
  type        = string
  default     = "production"
}

# ==========================================
# Providers
# ==========================================

provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ==========================================
# Vercel Project
# ==========================================

resource "vercel_project" "dreamengin" {
  name      = "dreamengin-${var.environment}"
  framework = "nextjs"
  
  git_repository = {
    type = "github"
    repo = "your-org/dreamengin"
  }
  
  build_command    = "pnpm run build"
  output_directory = ".next"
  install_command  = "corepack enable pnpm && pnpm install --frozen-lockfile"
  
  # Environment variables
  environment = [
    {
      key    = "NEXT_PUBLIC_SUPABASE_URL"
      value  = var.supabase_project_url
      target = ["production", "preview"]
    },
    {
      key       = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      value     = var.supabase_anon_key
      target    = ["production", "preview"]
      sensitive = true
    },
    {
      key    = "NODE_ENV"
      value  = "production"
      target = ["production"]
    }
  ]
}

# ==========================================
# Vercel Domain
# ==========================================

resource "vercel_project_domain" "dreamengin_primary" {
  project_id = vercel_project.dreamengin.id
  domain     = var.domain_name
}

resource "vercel_project_domain" "dreamengin_www" {
  project_id = vercel_project.dreamengin.id
  domain     = "www.${var.domain_name}"
  redirect   = var.domain_name
}

# ==========================================
# Cloudflare DNS Records
# ==========================================

resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = "cname.vercel-dns.com"
  type    = "CNAME"
  ttl     = 1
  proxied = true
}

# ==========================================
# Cloudflare Page Rules
# ==========================================

resource "cloudflare_page_rule" "cache_static" {
  zone_id  = var.cloudflare_zone_id
  target   = "${var.domain_name}/_next/static/*"
  priority = 1

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 31536000 # 1 year
  }
}

resource "cloudflare_page_rule" "cache_images" {
  zone_id  = var.cloudflare_zone_id
  target   = "${var.domain_name}/images/*"
  priority = 2

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 2592000 # 30 days
  }
}

# ==========================================
# Cloudflare Firewall Rules
# ==========================================

resource "cloudflare_ruleset" "waf" {
  zone_id     = var.cloudflare_zone_id
  name        = "DREAMengin WAF"
  description = "Web Application Firewall rules"
  kind        = "zone"
  phase       = "http_request_firewall_managed"

  rules {
    action = "managed_challenge"
    expression = "(cf.threat_score gt 14)"
    description = "Challenge high threat score"
    enabled = true
  }
}

# ==========================================
# Cloudflare Rate Limiting
# ==========================================

resource "cloudflare_rate_limit" "api_limit" {
  zone_id   = var.cloudflare_zone_id
  threshold = 100
  period    = 60
  match {
    request {
      url_pattern = "${var.domain_name}/api/*"
    }
  }
  action {
    mode    = "challenge"
    timeout = 3600
  }
}

resource "cloudflare_rate_limit" "upload_limit" {
  zone_id   = var.cloudflare_zone_id
  threshold = 10
  period    = 60
  match {
    request {
      url_pattern = "${var.domain_name}/api/upload/*"
      methods     = ["POST", "PUT"]
    }
  }
  action {
    mode    = "block"
    timeout = 300
  }
}

# ==========================================
# Outputs
# ==========================================

output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.dreamengin.id
}

output "vercel_deployment_url" {
  description = "Vercel deployment URL"
  value       = "https://${vercel_project.dreamengin.name}.vercel.app"
}

output "primary_domain" {
  description = "Primary domain URL"
  value       = "https://${var.domain_name}"
}

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID"
  value       = var.cloudflare_zone_id
}
