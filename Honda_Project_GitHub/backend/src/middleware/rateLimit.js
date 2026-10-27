// Small in-memory limiter for the login endpoint (no extra npm package needed).
// After `max` failed attempts for the same email + IP inside `windowMs`, further
// attempts are blocked until the window expires.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;

const keyFor = (req) => `${String(req.body?.email || '').toLowerCase().trim()}|${req.ip}`;

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
}, 60 * 1000).unref();

export const loginLimiter = (req, res, next) => {
  const key = keyFor(req);
  const entry = attempts.get(key);
  if (entry && entry.count >= MAX_FAILS && entry.resetAt > Date.now()) {
    const minutes = Math.ceil((entry.resetAt - Date.now()) / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many wrong passwords. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    });
  }
  res.on('finish', () => {
    if (res.statusCode === 401) {
      const cur = attempts.get(key);
      if (!cur || cur.resetAt <= Date.now()) attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
      else cur.count += 1;
    } else if (res.statusCode === 200) {
      attempts.delete(key);
    }
  });
  next();
};
