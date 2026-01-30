# 🚀 DREAMengin Infrastructure as Code (IaC)

## Revolutionary One-Command Deployment System

This directory contains everything needed to deploy DREAMengin with a single command, using only **FREE** and open-source technologies.

---

## 📦 What's Included

```
dreamengin-iac/
├── docker-compose.yml          # Complete local dev environment
├── Dockerfile                  # Production-ready multi-stage build
├── Dockerfile.dev              # Development with hot-reload
├── terraform/                  # Infrastructure provisioning
│   └── main.tf                 # Vercel + Cloudflare config
├── kubernetes/                 # K8s deployments
│   └── deployment.yaml         # Complete K8s manifests
├── ci-cd/                      # Automated pipelines
│   └── github-actions.yml      # CI/CD workflow
└── scripts/                    # Deployment scripts
    └── deploy.sh              # ONE-COMMAND deployment
```

---

## 🎯 Key Features

### 1. **One-Command Deployment**
```bash
./scripts/deploy.sh
```
That's it! The script will:
- Check prerequisites
- Offer deployment options
- Configure environment
- Deploy automatically
- Provide access URLs

### 2. **Complete Local Environment**
```bash
docker-compose up
```
Includes:
- Next.js app with hot-reload
- PostgreSQL database
- Redis cache
- MinIO (S3-compatible storage)
- Nginx reverse proxy
- Prometheus metrics
- Grafana dashboards
- Mailhog (email testing)
- Adminer (database UI)

### 3. **Production-Ready Infrastructure**
- Multi-stage Docker builds
- Kubernetes auto-scaling
- Terraform automation
- CI/CD pipelines
- Health checks
- Monitoring

### 4. **100% FREE Stack**
- Vercel (frontend hosting)
- Supabase (free tier)
- Cloudflare (CDN + DNS)
- GitHub Actions (CI/CD)
- MinIO (self-hosted S3)
- All open-source tools

---

## 🚀 Quick Start

### Option 1: Local Development (Recommended for testing)

```bash
# 1. Clone repository
git clone <your-repo>
cd dreamengin

# 2. Copy IaC files to project root
cp -r dreamengin-iac/* .

# 3. Create environment file
cp .env.example .env
# Edit .env with your credentials

# 4. Start everything
docker-compose up -d

# 5. Access application
open http://localhost:3000
```

**Services URLs:**
- **App**: http://localhost:3000
- **Database UI**: http://localhost:8080
- **Metrics**: http://localhost:3001
- **Object Storage**: http://localhost:9001
- **Email Testing**: http://localhost:8025

### Option 2: One-Command Production Deployment

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment wizard
./scripts/deploy.sh

# Follow prompts to select:
# 1) Local Development
# 2) Production (Vercel)
# 3) Kubernetes
# 4) Terraform (Infrastructure)
# 5) Full Stack (All of above)
```

### Option 3: Manual Production Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## 📋 Prerequisites

### Required
- **Node.js** 24.x or higher
- **npm** or **yarn**
- **Git**

### Optional (for advanced features)
- **Docker** + Docker Compose (local dev)
- **kubectl** (Kubernetes)
- **Terraform** (infrastructure automation)
- **Vercel account** (production hosting)
- **Supabase account** (database)

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Database (local dev)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dreamengin

# Node
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Vercel (optional)
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx
VERCEL_PROJECT_ID=xxx

# Cloudflare (optional)
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ZONE_ID=xxx
```

### Terraform Variables

Create `terraform/terraform.tfvars`:

```hcl
vercel_api_token      = "your-token"
cloudflare_api_token  = "your-token"
cloudflare_zone_id    = "your-zone-id"
domain_name           = "dreamengin.com"
supabase_project_url  = "https://xxx.supabase.co"
supabase_anon_key     = "your-key"
environment           = "production"
```

---

## 🐳 Docker Compose Services

### Core Services

**App** (Next.js)
- Port: 3000
- Hot-reload enabled
- Volume mounted for live updates

**Database** (PostgreSQL 15)
- Port: 5432
- Auto-runs migrations on startup
- Persistent data volume

**Redis**
- Port: 6379
- For caching and real-time features

**MinIO** (S3-compatible storage)
- API Port: 9000
- Console Port: 9001
- Auto-creates buckets:
  - avatars (public)
  - covers (public)
  - experiment-data (private)

### Monitoring Stack

**Prometheus**
- Port: 9090
- Collects metrics from all services

**Grafana**
- Port: 3001
- Pre-configured dashboards
- Default login: admin/admin

### Development Tools

**Adminer** (Database UI)
- Port: 8080
- Visual database management

**Mailhog** (Email Testing)
- SMTP Port: 1025
- Web UI: 8025
- Catches all emails for testing

---

## ☸️ Kubernetes Deployment

### Setup

```bash
# Apply all manifests
kubectl apply -f kubernetes/

# Check deployment status
kubectl get pods -n dreamengin

# View services
kubectl get svc -n dreamengin

# Check logs
kubectl logs -f deployment/dreamengin-app -n dreamengin
```

### Features

- **Auto-scaling**: 3-10 replicas based on CPU/memory
- **Rolling updates**: Zero-downtime deployments
- **Health checks**: Liveness and readiness probes
- **Resource limits**: Defined CPU and memory
- **Ingress**: Nginx with SSL via cert-manager

### Accessing Application

```bash
# Get external IP
kubectl get ingress -n dreamengin

# Port forward (for testing)
kubectl port-forward svc/dreamengin-service 3000:80 -n dreamengin
```

---

## 🏗️ Terraform Infrastructure

### Initialize

```bash
cd terraform
terraform init
```

### Plan

```bash
terraform plan -out=tfplan
```

### Apply

```bash
terraform apply tfplan
```

### Destroy

```bash
terraform destroy
```

### What It Creates

**Vercel**
- Project configuration
- Environment variables
- Domain mappings
- Build settings

**Cloudflare**
- DNS records (A, CNAME)
- Page rules (caching)
- Firewall rules (WAF)
- Rate limiting

**Configuration**
- SSL certificates (automatic)
- CDN optimization
- DDoS protection
- Performance optimization

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Automatically runs on:
- Push to `main` or `develop`
- Pull requests

### Pipeline Stages

1. **Code Quality**
   - TypeScript type checking
   - ESLint linting
   - Code formatting

2. **Build & Test**
   - Install dependencies
   - Build Next.js
   - Run tests (if any)

3. **Security Scan**
   - npm audit
   - Trivy vulnerability scan
   - SAST analysis

4. **Docker Build**
   - Multi-platform build (amd64, arm64)
   - Push to GitHub Container Registry
   - Tag with version and SHA

5. **Deploy**
   - Deploy to Vercel (production)
   - Optional: Deploy to Kubernetes
   - Run smoke tests

6. **Monitoring**
   - Health check verification
   - Performance metrics
   - Error tracking

### Setup GitHub Actions

1. Add secrets to repository:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   VERCEL_TOKEN
   VERCEL_ORG_ID
   VERCEL_PROJECT_ID
   ```

2. Copy workflow file:
   ```bash
   mkdir -p .github/workflows
   cp ci-cd/github-actions.yml .github/workflows/deploy.yml
   ```

3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Add CI/CD pipeline"
   git push
   ```

---

## 📊 Monitoring & Observability

### Prometheus Metrics

Available at `http://localhost:9090`

**Collected Metrics:**
- Request rate
- Response times
- Error rates
- CPU usage
- Memory usage
- Database connections

### Grafana Dashboards

Available at `http://localhost:3001`

**Pre-configured Dashboards:**
- Application Performance
- Database Metrics
- Infrastructure Health
- Business Metrics (revenue, users, etc.)

### Custom Metrics

Add to your Next.js API routes:

```typescript
import { Counter, Histogram } from 'prom-client';

// Counter for requests
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Histogram for response times
const responseTime = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
});
```

---

## 🔒 Security Best Practices

### Container Security

✅ Multi-stage builds (smaller images)
✅ Non-root user in containers
✅ Health checks
✅ Resource limits
✅ Read-only root filesystem (where possible)

### Network Security

✅ HTTPS enforced
✅ WAF enabled (Cloudflare)
✅ Rate limiting
✅ DDoS protection
✅ API endpoint protection

### Data Security

✅ Secrets management (environment variables)
✅ Database encryption at rest
✅ TLS for all connections
✅ Regular security scans (Trivy)

---

## 🐛 Troubleshooting

### Docker Compose Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs -f

# Restart specific service
docker-compose restart app

# Rebuild containers
docker-compose down
docker-compose up --build
```

**Port conflicts:**
```bash
# Change ports in docker-compose.yml
# Example: Change 3000:3000 to 3001:3000
```

**Database connection failed:**
```bash
# Wait for database to be ready
docker-compose logs db

# Manually run migrations
docker-compose exec app npm run db:migrate
```

### Kubernetes Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n dreamengin
kubectl logs <pod-name> -n dreamengin
```

**Out of resources:**
```bash
# Check cluster resources
kubectl top nodes
kubectl top pods -n dreamengin

# Scale down if needed
kubectl scale deployment dreamengin-app --replicas=1 -n dreamengin
```

### Vercel Deploy Issues

**Build fails:**
```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Node version mismatch

# Fix Node version in package.json:
"engines": {
  "node": "24.x"
}
```

**Environment variables not set:**
```bash
# Set via Vercel dashboard or CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
```

---

## 📈 Performance Optimization

### Docker

- **Multi-stage builds**: Reduces image size by 70%
- **Layer caching**: Speeds up builds
- **Dependency caching**: npm ci with cache

### Next.js

- **Image optimization**: Automatic with next/image
- **Bundle splitting**: Code splitting per route
- **Static generation**: Pre-render where possible
- **Edge caching**: Via Vercel Edge Network

### Database

- **Connection pooling**: Supabase built-in
- **Indexed queries**: All foreign keys indexed
- **Query optimization**: EXPLAIN ANALYZE on slow queries

### CDN

- **Cloudflare**: Global CDN with 280+ locations
- **Static assets**: Cached for 1 year
- **API responses**: Cached when appropriate

---

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier | Upgrade At |
|---------|-----------|------------|
| Vercel | 100GB bandwidth/month | $20/month (Pro) |
| Supabase | 500MB database, 1GB storage | $25/month (Pro) |
| Cloudflare | Unlimited bandwidth | $20/month (Pro) |
| GitHub Actions | 2,000 minutes/month | $4/month (extra) |
| Docker Hub | Unlimited public images | $5/month (Pro) |

**Total: $0/month** for small to medium traffic

**When to upgrade:**
- 10,000+ monthly active users
- 500GB+ bandwidth
- 2GB+ database size
- 100GB+ file storage

---

## 🎓 Learning Resources

### Docker
- Official Docs: https://docs.docker.com
- Best Practices: https://docs.docker.com/develop/dev-best-practices

### Kubernetes
- Interactive Tutorial: https://kubernetes.io/docs/tutorials
- kubectl Cheat Sheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet

### Terraform
- Getting Started: https://learn.hashicorp.com/terraform
- Registry: https://registry.terraform.io

### CI/CD
- GitHub Actions: https://docs.github.com/en/actions
- Best Practices: https://docs.github.com/en/actions/guides

---

## 🤝 Contributing

### Adding New Services

1. Add to `docker-compose.yml`:
   ```yaml
   new-service:
     image: service:latest
     ports:
       - "8080:8080"
     networks:
       - dreamengin-net
   ```

2. Add Kubernetes manifest:
   ```yaml
   # kubernetes/new-service.yaml
   ```

3. Update Terraform if needed

4. Update documentation

### Improving Pipeline

1. Edit `.github/workflows/deploy.yml`
2. Test locally with `act` tool
3. Submit PR with changes

---

## 📞 Support

### Issues

Report bugs or request features:
- GitHub Issues
- Email: devops@dreamengin.com

### Community

- Discord: [Join server]
- Twitter: @DREAMengin

---

## 🎉 Conclusion

This IaC setup provides:

✅ **One-command deployment**
✅ **Complete local dev environment**
✅ **Production-ready infrastructure**
✅ **Automated CI/CD pipeline**
✅ **Monitoring and observability**
✅ **Security best practices**
✅ **100% free for small/medium scale**

**Ready to deploy the most advanced creator platform ever built!** 🚀

---

**Next Steps:**

1. Review configuration files
2. Set up environment variables
3. Choose deployment method
4. Run `./scripts/deploy.sh`
5. Monitor deployment
6. Launch publicly!

**Let's revolutionize creator platforms! 🌟**
