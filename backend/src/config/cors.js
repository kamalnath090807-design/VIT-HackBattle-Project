/**
 * AURA Backend — CORS Configuration
 *
 * Source: docs/07-DEPLOYMENT.md §8
 *
 * Development: http://localhost:5173
 * Production: Exact Vercel deployment URL
 */

const { config } = require('./index');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (config.isDev) {
      // In development, allow localhost and any local network IP (e.g. 172.x, 192.168.x, 10.x)
      return callback(null, true);
    }
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = { corsOptions };
