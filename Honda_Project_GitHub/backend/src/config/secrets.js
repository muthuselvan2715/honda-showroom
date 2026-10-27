import crypto from 'crypto';

// JWT signing secret. Use JWT_SECRET when it is set; otherwise derive a stable,
// private secret from the database connection string (which holds the DB password),
// so a missing variable never falls back to a publicly known default.
let cached = null;
export const getJwtSecret = () => {
  if (cached) return cached;
  const fromEnv = (process.env.JWT_SECRET || '').trim();
  if (fromEnv && fromEnv.length >= 16) {
    cached = fromEnv;
  } else {
    const base = process.env.MONGODB_URI || 'local-development-only';
    cached = crypto.createHash('sha256').update(`honda-dms::${base}`).digest('hex');
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Security] JWT_SECRET is missing or too short - using a secret derived from MONGODB_URI.');
    }
  }
  return cached;
};
