#!/bin/bash

# SeismiStats - Docker Deployment Script
# For Docker Swarm with Nginx Proxy Manager

set -e

echo "🚀 SeismiStats Deployment Script"
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
docker build --build-arg VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN -t seismistats:latest .

echo ""
echo "✅ Build complete!"

# Check if stack is already deployed
if docker stack ps seismistats &>/dev/null; then
    echo ""
    echo "🔄 Updating existing stack..."
    docker service update --force seismistats_seismistats
else
    echo ""
    echo "🆕 Deploying new stack..."
    docker stack deploy -c docker-compose.seismistats.yml seismistats
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Nginx Proxy Manager: http://your-server:81"
echo "2. Add Proxy Host:"
echo "   - Domain: seismistats.yourdomain.com"
echo "   - Forward Hostname: seismistats_seismistats"
echo "   - Forward Port: 80"
echo "3. Enable SSL (Let's Encrypt)"
echo "4. Add Access List for authentication"
echo ""
echo "📊 Monitor deployment:"
echo "   docker service ps seismistats_seismistats"
echo "   docker service logs -f seismistats_seismistats"
