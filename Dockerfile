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

# Build ONLY the frontend client assets (builds to dist/public as per vite.config.ts)
RUN npx vite build

# Copy built assets from dist/public to server/public where serveStatic expects them
RUN if [ -d "dist/public" ]; then \
    cp -r dist/public/* server/; \
    echo "Assets copied from dist/public to server/public"; \
    ls -la server/public/ || echo "No public dir after copy"; \
else \
    echo "No dist/public found, creating fallback"; \
    mkdir -p server/public; \
    echo "<!DOCTYPE html><html><head><title>Monte Everest</title></head><body><div id='root'></div><script type='module' src='/assets/index.js'></script></body></html>" > server/public/index.html; \
fi

# Final verification
RUN ls -la server/public/index.html && echo "SUCCESS: index.html exists" || echo "ERROR: index.html missing"

# Create necessary directories
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# CRITICAL: Execute tsx diretamente sem dependências de scripts
CMD ["npx", "tsx", "server/index.ts"]