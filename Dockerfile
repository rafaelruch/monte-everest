# Multi-stage build to separate dev dependencies from production
FROM node:20-alpine AS builder

# Install build dependencies for native modules like bcrypt
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Build only the frontend (client)
RUN npm run build:client || vite build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Copy source code and built assets
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY shared ./shared
COPY client/public ./client/public

# Create necessary directories
RUN mkdir -p uploads public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the application with tsx directly from server source
CMD ["tsx", "server/index.ts"]