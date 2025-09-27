#!/bin/bash

# Pacific Paper Cups - Post-Deployment Setup Script
# This script helps configure the application after deployment

echo "🚀 Running post-deployment setup for Pacific Paper Cups..."

# Check if required environment variables are set
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "⚠️  WARNING: NEXTAUTH_SECRET is not set. Generating a random one..."
  export NEXTAUTH_SECRET=$(openssl rand -base64 32)
  echo "ℹ️  Using generated NEXTAUTH_SECRET"
fi

# Ensure cookies are properly configured for proxy setups (like Coolify without custom SSL)
if [ "$NODE_ENV" = "production" ]; then
  echo "🔒 Configuring cookies for proxy setup..."
  
  # For Coolify deployments without SSL termination at app level,
  # we disable secure cookies to ensure they work properly behind proxy
  if [ -z "$USE_SECURE_COOKIES" ]; then
    export USE_SECURE_COOKIES=false
  fi
  if [ -z "$DISABLE_SECURE_COOKIES" ]; then
    export DISABLE_SECURE_COOKIES=true
  fi
  
  echo "✅ Cookie security configured for proxy setup"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (in case it's needed after migration)
echo "🔄 Generating Prisma client..."
npx prisma generate

# Seed the database to create default users and company settings
echo "🌱 Seeding database with default users and company settings..."
npm run db:seed || echo "⚠️  Database seeding failed - this may be expected on first run"

echo "✅ Post-deployment setup completed!"
echo ""
echo "📋 Important notes for deployment:"
echo "   - Ensure NEXTAUTH_SECRET is set in your Coolify environment variables"
echo "   - Default users created:"
echo "     * Admin: admin@pacificpapercups.com / admin123"
echo "     * Vick: vick@pacificpapercups.com / default123"
echo "     * Art: art@pacificpapercups.com / default123"
echo "     * Lilit: lilit@pacificcups.com / default123"
echo "   - Users can change passwords after first login"
echo "   - Admin can update company settings and manage users"
echo ""
echo "🔗 Access your application at the URL provided by Coolify"