import { app } from '../src/server/app.js';

// Vercel serverless entry point exporting the Express application
export default function handler(req: any, res: any) {
  return app(req, res);
}
