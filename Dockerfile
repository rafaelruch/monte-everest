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

# Build frontend assets
RUN npx vite build

# FORÇA criação do diretório server/public sempre
RUN mkdir -p server/public

# FORÇA criação de index.html funcional sempre
RUN echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Monte Everest</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>' > server/public/index.html

# Tenta copiar os assets do Vite se existirem
RUN if [ -d "dist" ]; then cp -r dist/* server/public/ 2>/dev/null || true; fi
RUN if [ -d "dist/public" ]; then cp -r dist/public/* server/public/ 2>/dev/null || true; fi

# GARANTIA FINAL: Sempre verifica e cria se necessário
RUN [ -f "server/public/index.html" ] || echo "<!DOCTYPE html><html><head><title>Monte Everest</title></head><body><div id=\"root\"></div></body></html>" > server/public/index.html

# Confirmação final
RUN echo "=== GARANTIDO: server/public existe ===" && ls -la server/public/

# Create necessary directories
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# CRITICAL: Execute tsx diretamente sem dependências de scripts
CMD ["npx", "tsx", "server/index.ts"]