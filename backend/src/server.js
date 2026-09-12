/**
 * AURA Backend — Express Server Entry Point
 *
 * Source: docs/02-ARCHITECTURE.md §6
 *
 * Middleware stack order:
 * 1. CORS
 * 2. Helmet (security headers)
 * 3. Morgan (request logging)
 * 4. JSON body parser
 * 5. Route handlers (auth applied per-route)
 * 6. Global error handler
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { config, validateConfig } = require('./config');
const { corsOptions } = require('./config/cors');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Load environment variables and validate
validateConfig();

const app = express();

// ─── Global Middleware ──────────────────────────────────────────────

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('combined', {
  // Skip logging for health checks in production
  skip: (req) => !config.isDev && req.path === '/api/v1/health',
}));
app.use(express.json({ limit: '1mb' }));

// ─── Route Mounting ─────────────────────────────────────────────────

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const auditRoutes = require('./routes/audit');
const toolRoutes = require('./routes/tools');

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/tasks', auditRoutes); // /tasks/:taskId/audit
app.use('/api/v1/tools', toolRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
    },
  });
});

// ─── Global Error Handler (must be last) ────────────────────────────

app.use(errorHandler);

// ─── Server Start ───────────────────────────────────────────────────

if (require.main === module) {
  app.listen(config.port, () => {
    logger.info('Server', `AURA backend running on port ${config.port}`, {
      environment: config.nodeEnv,
      aiProvider: config.aiProvider,
    });
  });
}

// Export for testing with supertest
module.exports = app;
