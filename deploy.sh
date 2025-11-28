#!/bin/bash

# ETS Events - Docker Deployment Script
# For Docker Swarm with Nginx Proxy Manager

set -e

echo "🚀 ETS Events Deployment Script"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with VITE_MAPBOX_TOKEN"
    exit 1
fi

# Load environment variables
source .env

if [ -z "$VITE_MAPBOX_TOKEN" ]; then
    echo "❌ Error: VITE_MAPBOX_TOKEN not set in .env"
    exit 1
fi

# Build the image
echo ""
echo "📦 Building Docker image..."
docker build --build-arg VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN -t ets-events:latest .

echo ""
echo "✅ Build complete!"

# Check if stack is already deployed
if docker stack ps ets &>/dev/null; then
    echo ""
    echo "🔄 Updating existing stack..."
    docker service update --force ets_ets-events
else
    echo ""
    echo "🆕 Deploying new stack..."
    docker stack deploy -c docker-compose.ets-events.yml ets
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Nginx Proxy Manager: http://your-server:81"
echo "2. Add Proxy Host:"
echo "   - Domain: ets.yourdomain.com"
echo "   - Forward Hostname: ets_ets-events"
echo "   - Forward Port: 80"
echo "3. Enable SSL (Let's Encrypt)"
echo "4. Add Access List for authentication"
echo ""
echo "📊 Monitor deployment:"
echo "   docker service ps ets_ets-events"
echo "   docker service logs -f ets_ets-events"
