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

# Ensure public directory points to built assets
RUN ln -sf dist public 2>/dev/null || mkdir -p public

# Create necessary directories
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# CRITICAL: Use script bash que garante tsx em produção
CMD ["./production-start.sh"]