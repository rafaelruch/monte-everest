# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev deps for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Build production server separately
RUN npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.js

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application with production server
CMD ["node", "dist/server.js"]