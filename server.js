import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Check if dist folder exists, if not, build the app
const distPath = join(__dirname, 'dist');
const indexPath = join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('📦 Application non compilée. Compilation automatique en cours...');
  try {
    execSync('npm run build', { 
      stdio: 'inherit', 
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log('✅ Compilation terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la compilation:', error.message);
    process.exit(1);
  }
}

// Enable compression
app.use(compression());

// Serve static files from the dist directory
app.use(express.static(distPath, {
  maxAge: '1y',
  etag: true
}));

// Handle SPA routing - serve index.html for all routes
// Using middleware instead of app.get('*') for Express 5 compatibility
app.use((req, res, next) => {
  // Only handle GET requests for HTML pages
  if (req.method === 'GET' && req.accepts('html')) {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(503).send('Application en cours de démarrage. Veuillez rafraîchir dans quelques secondes.');
    }
  } else {
    next();
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Local Deals Togo is running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}`);
});
