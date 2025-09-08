# 🚀 Monte Everest - Instruções de Deploy em Produção

## ❌ PROBLEMA CONHECIDO
O comando `npm start` falha em produção devido a dependências do Vite. **NUNCA use `npm start` em produção.**

## ✅ SOLUÇÃO PARA PRODUÇÃO

### Opção 1: Docker (Recomendada)
```bash
docker build -t monte-everest .
docker run -p 5000:5000 --env-file .env monte-everest
```

### Opção 2: Script de Produção
```bash
# Execute este comando em vez de npm start:
./production-start.sh
```

### Opção 3: Comando Direto
```bash
# Se preferir executar diretamente:
NODE_ENV=production tsx server/index.ts
```

## 🔧 Para EasyPanel/Hospeadagem
**Configure o comando de start como:**
```bash
./production-start.sh
```

**OU se não funcionar:**
```bash
NODE_ENV=production npx tsx server/index.ts
```

## 🗂️ Arquivos Importantes
- `Dockerfile` - Configuração Docker pronta para produção
- `production-start.sh` - Script que substitui npm start  
- `start-production.js` - Script Node.js alternativo
- `server/index.ts` - Servidor principal com imports condicionais

## ⚠️ NUNCA Execute
- `npm start` (quebra em produção)
- `node dist/index.js` (contém dependências problemáticas do Vite)
- Qualquer build do servidor via esbuild