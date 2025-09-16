#!/bin/bash

# PramanMitra Deployment Script - Vercel (Frontend) + Railway (Backend)
# Make sure you have vercel and railway CLI installed

set -e

echo "🚀 Starting PramanMitra deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI not found. Please install it:${NC}"
        echo "npm install -g vercel"
        exit 1
    fi
    
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}❌ Railway CLI not found. Please install it:${NC}"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Deploy backend to Railway
deploy_backend() {
    echo ""
    echo "📦 Deploying backend to Railway..."
    echo "=================================="
    
    cd backend
    
    # Initialize Railway project if needed
    if [ ! -f ".railway/config.json" ]; then
        echo "Initializing new Railway project..."
        railway init
    fi
    
    # Deploy to Railway
    railway up
    
    # Get the deployment URL
    BACKEND_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*' | grep -o '[^"]*$' || echo "")
    
    if [ -z "$BACKEND_URL" ]; then
        echo -e "${YELLOW}⚠️  Could not automatically retrieve Railway URL${NC}"
        echo "Please get your Railway URL from: https://railway.app"
        read -p "Enter your Railway backend URL: " BACKEND_URL
    else
        echo -e "${GREEN}✅ Backend deployed to: $BACKEND_URL${NC}"
    fi
    
    cd ..
}

# Deploy frontend to Vercel
deploy_frontend() {
    echo ""
    echo "📦 Deploying frontend to Vercel..."
    echo "=================================="
    
    cd frontend
    
    # Create production environment file
    echo "REACT_APP_API_URL=${BACKEND_URL}/api" > .env.production
    echo "REACT_APP_ENVIRONMENT=production" >> .env.production
    
    # Build the frontend
    echo "Building frontend..."
    npm run build
    
    # Deploy to Vercel
    echo "Deploying to Vercel..."
    vercel --prod
    
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
    
    cd ..
}

# Main deployment flow
main() {
    check_requirements
    
    echo ""
    echo "This script will deploy:"
    echo "  - Backend to Railway"
    echo "  - Frontend to Vercel"
    echo ""
    read -p "Continue? (y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    deploy_backend
    deploy_frontend
    
    echo ""
    echo "=================================="
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure environment variables in Railway dashboard"
    echo "2. Configure environment variables in Vercel dashboard"
    echo "3. Set up custom domains if needed"
    echo "4. Test your deployed application"
    echo ""
    echo "Railway Dashboard: https://railway.app/dashboard"
    echo "Vercel Dashboard: https://vercel.com/dashboard"
}

# Run main function
main