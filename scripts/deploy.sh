#!/bin/bash

# ==========================================
# DREAMengin One-Command Deployment Script
# ==========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  DREAMengin Deployment Script v2.0    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    fi
    print_success "$1 is installed"
    return 0
}

run_pnpm() {
    corepack pnpm "$@"
}

run_vercel() {
    run_pnpm dlx vercel@latest "$@"
}

docker_compose_cmd() {
    if docker compose version >/dev/null 2>&1; then
        docker compose "$@"
        return
    fi

    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose "$@"
        return
    fi

    print_error "Docker Compose is required"
    exit 1
}

# Print header
print_header

# ==========================================
# Check Prerequisites
# ==========================================
print_info "Checking prerequisites..."

MISSING_DEPS=0

check_command "node" || MISSING_DEPS=1
check_command "corepack" || MISSING_DEPS=1
check_command "git" || MISSING_DEPS=1
check_command "docker" || print_info "Docker not found (optional)"
check_command "kubectl" || print_info "kubectl not found (optional)"
check_command "terraform" || print_info "Terraform not found (optional)"

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Missing required dependencies. Please install them first."
    exit 1
fi

echo ""

# ==========================================
# Deployment Mode Selection
# ==========================================
print_info "Select deployment mode:"
echo "1) Local Development (Docker Compose)"
echo "2) Production (Vercel)"
echo "3) Kubernetes (K8s)"
echo "4) Complete Infrastructure (Terraform)"
echo "5) Full Stack (All of the above)"
echo ""
read -p "Enter choice [1-5]: " DEPLOY_MODE

echo ""

# ==========================================
# Environment Variables
# ==========================================
if [ ! -f ".env" ]; then
    print_info "Creating .env file..."
    cat > .env << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database (for local dev)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dreamengin

# Node Environment
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# Optional: Vercel
VERCEL_TOKEN=

# Optional: Cloudflare
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
EOF
    print_success ".env file created"
    print_info "Please edit .env file with your actual credentials"
    read -p "Press enter to continue after updating .env..."
fi

# Load environment variables
source .env

# ==========================================
# Local Development (Docker Compose)
# ==========================================
deploy_local() {
    print_info "Starting local development environment..."
    
    if ! check_command "docker"; then
        print_error "Docker is required for local development"
        exit 1
    fi
    
    if docker compose version >/dev/null 2>&1; then
        print_success "docker compose is available"
    elif command -v docker-compose >/dev/null 2>&1; then
        print_success "docker-compose is installed"
    else
        print_error "Docker Compose is required"
        exit 1
    fi
    
    # Build and start services
    print_info "Building Docker images..."
    docker_compose_cmd build
    
    print_info "Starting services..."
    docker_compose_cmd up -d
    
    print_info "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker_compose_cmd ps | grep -q "Up"; then
        print_success "All services are running!"
        echo ""
        print_info "Access points:"
        echo "  - App:         http://localhost:3000"
        echo "  - MinIO:       http://localhost:9001"
        echo "  - Adminer:     http://localhost:8080"
        echo "  - Grafana:     http://localhost:3001"
        echo "  - Prometheus:  http://localhost:9090"
        echo "  - Mailhog:     http://localhost:8025"
        echo ""
        print_info "To view logs: docker compose logs -f"
        print_info "To stop:      docker compose down"
    else
        print_error "Some services failed to start"
        docker_compose_cmd logs
        exit 1
    fi
}

# ==========================================
# Production Deployment (Vercel)
# ==========================================
deploy_production() {
    print_info "Deploying to Vercel..."
    
    # Check for Vercel token
    if [ -z "$VERCEL_TOKEN" ]; then
        print_info "Vercel token not found in .env"
        print_info "Please run: vercel login"
        run_vercel login
    fi
    
    # Install dependencies
    print_info "Installing dependencies..."
    run_pnpm install --frozen-lockfile
    
    # Build
    print_info "Building application..."
    run_pnpm run build
    
    # Deploy
    print_info "Deploying to Vercel..."
    if [ -z "$VERCEL_TOKEN" ]; then
        run_vercel --prod
    else
        run_vercel --prod --token="$VERCEL_TOKEN"
    fi
    
    print_success "Deployed to Vercel!"
}

# ==========================================
# Kubernetes Deployment
# ==========================================
deploy_kubernetes() {
    print_info "Deploying to Kubernetes..."
    
    if ! check_command "kubectl"; then
        print_error "kubectl is required for Kubernetes deployment"
        exit 1
    fi
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        print_info "Please configure kubectl first"
        exit 1
    fi
    
    # Apply manifests
    print_info "Applying Kubernetes manifests..."
    kubectl apply -f kubernetes/
    
    # Wait for rollout
    print_info "Waiting for deployment to complete..."
    kubectl rollout status deployment/dreamengin-app -n dreamengin
    
    print_success "Deployed to Kubernetes!"
    
    # Get service URL
    print_info "Getting service information..."
    kubectl get services -n dreamengin
}

# ==========================================
# Terraform Infrastructure
# ==========================================
deploy_terraform() {
    print_info "Deploying infrastructure with Terraform..."
    
    if ! check_command "terraform"; then
        print_error "Terraform is required"
        exit 1
    fi
    
    cd terraform
    
    # Initialize
    print_info "Initializing Terraform..."
    terraform init
    
    # Plan
    print_info "Planning infrastructure changes..."
    terraform plan -out=tfplan
    
    # Confirm
    read -p "Apply these changes? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    # Apply
    print_info "Applying infrastructure..."
    terraform apply tfplan
    
    cd ..
    
    print_success "Infrastructure deployed!"
}

# ==========================================
# Full Stack Deployment
# ==========================================
deploy_fullstack() {
    print_info "Deploying full stack..."
    
    # Local development first
    deploy_local
    
    # Wait a bit
    sleep 5
    
    # Infrastructure
    if check_command "terraform"; then
        deploy_terraform
    fi
    
    # Production
    deploy_production
    
    print_success "Full stack deployed!"
}

# ==========================================
# Execute Selected Deployment
# ==========================================
case $DEPLOY_MODE in
    1)
        deploy_local
        ;;
    2)
        deploy_production
        ;;
    3)
        deploy_kubernetes
        ;;
    4)
        deploy_terraform
        ;;
    5)
        deploy_fullstack
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Deployment complete! 🚀"
echo ""
print_info "Next steps:"
echo "  1. Check deployment status"
echo "  2. Run smoke tests"
echo "  3. Monitor logs"
echo "  4. Update DNS if needed"
echo ""
