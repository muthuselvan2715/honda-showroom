import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('----------------------------------------------------');
  console.log('  HONDA MOTORCYCLE SHOWROOM MANAGEMENT SYSTEM API   ');
  console.log('----------------------------------------------------');

  // Attempt database connection
  const connected = await connectDB();
  // First run on an empty database: load the demo data automatically
  if (connected) {
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[Setup] Empty database detected - running seed script...');
        const seedPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../scripts/seed.js');
        const result = spawnSync(process.execPath, [seedPath], { stdio: 'inherit', env: process.env });
        console.log(result.status === 0 ? '[Setup] Demo data loaded.' : '[Setup] Seed script failed.');
      }
    } catch (error) {
      console.error(`[Setup] Auto-seed check failed: ${error.message}`);
    }
  }

  if (!connected) {
    console.warn('[WARNING] Starting Express server in offline/unconnected DB mode.');
    console.warn('[INFO] Configure a valid MongoDB Atlas MONGODB_URI in backend/.env to persist data.');
  }

  app.listen(PORT, () => {
    console.log(`[Server] Honda Dealership API running on port ${PORT}`);
    console.log(`[Health] http://localhost:${PORT}/api/health`);
    console.log(`[API V1] http://localhost:${PORT}/api/v1`);
  });
}

startServer();
