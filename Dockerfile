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

# Install all dependencies (needed for tsx to work)
RUN npm ci

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Copy source code
COPY . .

# Build ONLY the frontend client assets - DO NOT BUILD SERVER
RUN npx vite build

# Remove any existing dist/index.js to prevent conflicts
RUN rm -f dist/index.js

# Remove entire dist directory except client build
RUN find dist -name "*.js" -type f -delete 2>/dev/null || true

# Create the public directory where serveStatic expects it
RUN mkdir -p server/public

# Copy built assets to where serveStatic function expects them
RUN cp -r dist/* server/public/ 2>/dev/null || mkdir -p server/public

# Create necessary directories
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# CRITICAL: Execute tsx diretamente sem dependências de scripts
CMD ["npx", "tsx", "server/index.ts"]