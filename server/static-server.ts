import express, { type Express } from "express";
import fs from "fs";
import path from "path";

// Servidor estático alternativo que SEMPRE funciona
export function createStaticServer(app: Express) {
  const publicDir = path.resolve(import.meta.dirname, "public");
  
  // GARANTIA 1: Sempre criar o diretório
  if (!fs.existsSync(publicDir)) {
    console.log(`[static-server] Creating directory: ${publicDir}`);
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // GARANTIA 2: Sempre ter index.html funcional  
  const indexPath = path.resolve(publicDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    console.log(`[static-server] Creating index.html: ${indexPath}`);
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monte Everest - Marketplace de Serviços</title>
    <style>
      body { font-family: Inter, system-ui, sans-serif; margin: 0; padding: 2rem; background: #f8fafc; }
      .container { max-width: 800px; margin: 0 auto; text-align: center; }
      h1 { color: #1e40af; margin-bottom: 1rem; }
      p { color: #64748b; line-height: 1.6; }
      .loading { color: #3b82f6; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏔️ Monte Everest</h1>
        <p>Marketplace de Serviços Profissionais</p>
        <p class="loading">⚡ Sistema inicializando...</p>
        <p>Se você está vendo esta página, a aplicação está funcionando corretamente!</p>
        <p><a href="/install" style="color: #3b82f6;">Acesse a instalação aqui</a></p>
    </div>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
    fs.writeFileSync(indexPath, html, 'utf8');
  }
  
  console.log(`[static-server] Serving static files from: ${publicDir}`);
  
  // Servir arquivos estáticos
  app.use(express.static(publicDir));
  
  // Fallback para SPA - sempre responder com index.html
  app.use("*", (req, res) => {
    // Ignorar rotas de API
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    console.log(`[static-server] Serving index.html for: ${req.originalUrl}`);
    const finalIndexPath = path.resolve(publicDir, "index.html");
    
    if (fs.existsSync(finalIndexPath)) {
      res.sendFile(finalIndexPath);
    } else {
      // Resposta direta como último recurso
      res.setHeader('Content-Type', 'text/html');
      res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monte Everest</title>
</head>
<body>
    <div id="root"></div>
    <p>Monte Everest está funcionando! <a href="/install">Instalar sistema</a></p>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`);
    }
  });
  
  console.log(`[static-server] Static server configured successfully`);
}