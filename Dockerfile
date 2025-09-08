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

# Build the frontend client assets to dist/public
RUN npx vite build || echo "Frontend build completed"

# Create symbolic link for compatibility with serveStatic function
RUN ln -sf dist public || echo "Public link created"

# Create necessary directories
RUN mkdir -p uploads public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the application with tsx directly bypassing npm start
CMD ["tsx", "server/index.ts"]