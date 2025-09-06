// Simple production server without Vite dependencies
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// API Routes - Basic placeholder
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files
const publicPath = path.join(__dirname, 'dist', 'public');
app.use(express.static(publicPath));

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send('Application is starting...');
    }
  });
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});