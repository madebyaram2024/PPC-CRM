#!/bin/bash

# Pacific Paper Cups Deployment Script
# This script helps deploy the application using Coolify

set -e

echo "🚀 Starting Pacific Paper Cups deployment..."

# Check if required tools are installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install docker first."
    exit 1
fi

# Configuration
APP_NAME="pacific-paper-cups"
REGISTRY="your-registry"  # Change to your registry
IMAGE_NAME="$REGISTRY/$APP_NAME:latest"

echo "📋 Configuration:"
echo "  App Name: $APP_NAME"
echo "  Registry: $REGISTRY"
echo "  Image: $IMAGE_NAME"

# Build the Docker image
echo "🏗️  Building Docker image..."
docker build -t $IMAGE_NAME .

# Push to registry (if using a registry)
if [ "$REGISTRY" != "your-registry" ]; then
    echo "📤 Pushing image to registry..."
    docker push $IMAGE_NAME
fi

# Deploy to Coolify (this would be done through Coolify UI or API)
echo "🎯 Deployment package ready!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for production deployment'"
echo "   git push origin main"
echo ""
echo "2. In Coolify:"
echo "   - Create a new application"
echo "   - Connect to your GitHub repository"
echo "   - Use the provided Dockerfile"
echo "   - Set up environment variables"
echo "   - Deploy the application"
echo ""
echo "3. After deployment:"
echo "   - Run database migrations"
echo "   - Create admin user"
echo "   - Set up domain and SSL"
echo ""
echo "✅ Deployment preparation complete!"