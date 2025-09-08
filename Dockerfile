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

# Debug: List what was built
RUN echo "=== Contents of dist directory ===" && ls -la dist/ || echo "No dist directory"

# Remove any existing dist/index.js to prevent conflicts
RUN rm -f dist/index.js

# Create the public directory where serveStatic expects it
RUN mkdir -p server/public

# Copy built assets to where serveStatic function expects them
RUN if [ -d "dist" ]; then \
    cp -r dist/* server/public/; \
    echo "=== Assets copied to server/public ==="; \
    ls -la server/public/; \
else \
    echo "No dist directory found, creating empty server/public"; \
    touch server/public/index.html; \
fi

# Debug: Verify final structure
RUN echo "=== Final server/public contents ===" && ls -la server/public/

# Create necessary directories
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# CRITICAL: Execute tsx diretamente sem dependências de scripts
CMD ["npx", "tsx", "server/index.ts"]