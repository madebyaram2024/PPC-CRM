# Use official Node.js runtime as base image
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma folder first (needed for postinstall)
COPY prisma ./prisma

# Install all dependencies (including dev dependencies for build)
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Generate Prisma client and build the application
RUN npx prisma generate && npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chmod 777 uploads

# Expose port
EXPOSE 3000

# Set production environment variables to handle cookies properly
ENV NODE_ENV=production
# For proxy compatibility, use simple cookie settings
ENV USE_SECURE_COOKIES=false
ENV DISABLE_SECURE_COOKIES=true

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application with database setup
CMD ["/bin/sh", "-c", "npx prisma db push && npx prisma generate && (npm run db:seed || echo 'Seed failed, continuing...') && npm start"]