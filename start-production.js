#!/usr/bin/env node

// Script alternativo para produção que usa tsx diretamente
// Evita completamente o problema do Vite no dist/index.js

const { spawn } = require('child_process');
const path = require('path');

// Define NODE_ENV como production
process.env.NODE_ENV = 'production';

// Executa tsx diretamente no arquivo TypeScript
const tsx = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd()
});

tsx.on('exit', (code) => {
  process.exit(code);
});

tsx.on('error', (err) => {
  console.error('Erro ao executar tsx:', err);
  process.exit(1);
});