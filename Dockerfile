# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Set production environment variables to handle cookies properly
ENV NODE_ENV=production
# For proxy compatibility, use simple cookie settings
ENV USE_SECURE_COOKIES=false
ENV DISABLE_SECURE_COOKIES=true

# Start the application with database setup
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && npx prisma generate && (npm run db:seed || echo 'Seed failed, continuing...') && npm start"]