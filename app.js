const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas da API básicas
app.get('/api/install/status', (req, res) => {
  res.json({ installed: true, needsInstallation: false });
});

app.get('/api/categories', (req, res) => {
  res.json([]);
});

app.get('/api/categories/popular', (req, res) => {
  res.json([]);
});

app.get('/api/professionals/search', (req, res) => {
  res.json([]);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir arquivos estáticos
const publicDir = path.join(__dirname, 'dist', 'public');

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  
  app.get('*', (req, res) => {
    const indexPath = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send('<h1>Monte Everest</h1><p>Aplicação iniciando...</p>');
    }
  });
} else {
  app.get('*', (req, res) => {
    res.send('<h1>Monte Everest</h1><p>Aplicação iniciando...</p>');
  });
}

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Monte Everest rodando na porta ${port}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});