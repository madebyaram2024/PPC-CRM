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

# Start the application with database setup
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm start"]