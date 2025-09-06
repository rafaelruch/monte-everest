const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static('public'));

// Rotas essenciais para funcionamento básico
app.get('/api/install/status', (req, res) => {
  res.json({ installed: false, needsInstallation: true });
});

app.get('/api/categories', (req, res) => {
  res.json([]);
});

app.get('/api/professionals/search', (req, res) => {
  res.json([]);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Página inicial
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Monte Everest rodando na porta ${port}`);
});