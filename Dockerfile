# Use Node.js 20 LTS Alpine for smaller image size
FROM node:20-alpine

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

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p uploads public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the application directly with tsx (no build needed)
CMD ["npx", "tsx", "server/index.ts"]