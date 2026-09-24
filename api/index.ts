import { app } from '../src/server/app.js';
import { isDatabaseConfigured } from '../src/server/db.js';

// Vercel serverless entry point exporting the Express application
export default function handler(req: any, res: any) {
  const method = req.method || 'GET';
  const url = req.url || '/api';
  const hasDb = isDatabaseConfigured();
  console.log(`[Vercel Function] 🚀 ${method} ${url} | DATABASE_URL: ${hasDb ? '✅ PRESENT' : '❌ NOT FOUND in process.env'}`);
  return app(req, res);
}

