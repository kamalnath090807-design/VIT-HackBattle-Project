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
  origin: config.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

module.exports = { corsOptions };
