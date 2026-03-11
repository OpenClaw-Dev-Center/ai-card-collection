#!/bin/bash

# Deploy script for AI Card Collection Backend
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production

ENVIRONMENT=${1:-production}

echo "🚀 Deploying AI Card Collection Backend to $ENVIRONMENT..."

# Check if we're on the main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Error: Must be on main branch to deploy"
  exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm ci --only=production

# Run database migrations (if needed)
echo "🗄️  Running database migrations..."
# TODO: Add migration runner
# psql $DATABASE_URL -f migrations/001_initial_schema.sql

# Build (if TypeScript, skip for plain JS)
echo "🔨 Building..."
# No build step needed for plain JS

# Restart server (depends on hosting platform)
echo "🔄 Restarting server..."
# For Railway:
# railway up
# For Render:
# curl -X POST https://api.render.com/v1/services/$SERVICE_ID/deploys
# For PM2:
# pm2 restart ai-card-collection-api

echo "✅ Deployment complete!"
echo "🌐 API should be available at: https://ai-card-collection-api.onrender.com (or your domain)"
echo "📚 Check health: curl https://your-domain.com/health"
