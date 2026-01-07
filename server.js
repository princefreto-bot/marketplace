import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable compression
app.use(compression());

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1y',
  etag: true
}));

// Handle SPA routing - serve index.html for all routes
// Using middleware instead of app.get('*') for Express 5 compatibility
app.use((req, res, next) => {
  // Only handle GET requests for HTML pages
  if (req.method === 'GET' && req.accepts('html')) {
    const indexPath = join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not built. Run npm run build first.');
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
