#!/bin/bash

echo "🚀 Initializing Pacific Paper Cups CRM..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed the database
echo "🌱 Seeding database with admin users..."
npm run db:seed

echo "✅ Initialization complete!"
echo "🔑 Login with: admin@pacificcups.com / admin123"

# Start the application
echo "🚀 Starting application..."
npm start