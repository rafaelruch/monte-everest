# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /workspace

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev deps for build)
RUN npm ci

# Copy source code
COPY . .

# Build the client application
RUN npm run build

# Remove dev dependencies after build  
RUN npm prune --production

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application with simple server
CMD ["node", "server.js"]