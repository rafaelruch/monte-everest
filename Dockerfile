# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage  
FROM node:18-alpine
WORKDIR /workspace

# Copy simple server and built files
COPY package-simple.json ./package.json
COPY app.js ./
COPY --from=builder /app/dist ./dist

# Install only express (CommonJS - no module issues)
RUN npm install

# Expose port
EXPOSE 5000
ENV NODE_ENV=production

# Start with simple CommonJS server
CMD ["node", "app.js"]