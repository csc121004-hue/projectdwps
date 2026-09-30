import express from 'express';
import path from 'path';
import { app } from './src/server/app.js';
import { createServer as createViteServer } from 'vite';
import { checkDbConnection, initializeDatabase, isDatabaseConfigured } from './src/server/db.js';

const isDev = process.env.NODE_ENV !== 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  console.log(`[DWPS Server] Starting in ${isDev ? 'development' : 'production'} mode on port ${PORT}...`);

  // Check Neon DB connection status
  if (isDatabaseConfigured()) {
    console.log('[DWPS Server] DATABASE_URL detected. Testing Neon connection...');
    const status = await checkDbConnection();
    if (status.ok) {
      console.log(`[DWPS Server] ✅ ${status.message}`);
      await initializeDatabase();
    } else {
      console.warn(`[DWPS Server] ⚠️ Database connection check: ${status.message}`);
    }
  } else {
    console.log('[DWPS Server] ℹ️ DATABASE_URL not set in environment. Running with local storage fallback.');
  }

  if (isDev) {
    // Mount Vite middleware in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DWPS Server] 🚀 App listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[DWPS Server] Fatal server startup error:', err);
  process.exit(1);
});
