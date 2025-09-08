#!/bin/bash

# Script definitivo para produção - substitui npm start completamente
# Garante que nunca executa o dist/index.js problemático

echo "🚀 Iniciando Monte Everest em modo produção..."

# Define NODE_ENV como production
export NODE_ENV=production

# Verifica se tsx está disponível
if ! command -v tsx &> /dev/null; then
    echo "Instalando tsx..."
    npm install -g tsx
fi

# Remove qualquer dist/index.js problemático
rm -f dist/index.js 2>/dev/null || true

echo "✅ Executando servidor com tsx..."
exec tsx server/index.ts