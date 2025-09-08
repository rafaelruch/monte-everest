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

# Build ONLY the frontend client assets
RUN npx vite build

# Create the public directory where serveStatic expects it
RUN mkdir -p server/public

# Copy built assets with proper fallback and ensure index.html exists
RUN if [ -d "dist" ] && [ "$(ls -A dist)" ]; then \
    cp -r dist/* server/public/ 2>/dev/null || true; \
else \
    echo "Creating fallback index.html"; \
fi

# Ensure index.html exists - create basic fallback if missing
RUN if [ ! -f "server/public/index.html" ]; then \
    echo "<!DOCTYPE html><html><head><title>Monte Everest</title></head><body><div id='root'></div><script src='/assets/index.js'></script></body></html>" > server/public/index.html; \
fi

# Remove any server JS files that might cause issues
RUN find server/public -name "*.js" -path "*/server/*" -delete 2>/dev/null || true

# Create necessary directories
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# CRITICAL: Execute tsx diretamente sem dependências de scripts
CMD ["npx", "tsx", "server/index.ts"]