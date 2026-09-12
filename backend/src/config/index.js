/**
 * AURA Backend — Centralized Configuration
 *
 * Single import point for all environment variables.
 * Validates required vars on startup.
 * Source: docs/11-INTEGRATION-CONTRACT.md §10
 */

require('dotenv').config();

const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // Supabase (backend owns DB access)
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,

  // AI Provider config — passed to agent module, NOT used directly in routes
  aiProvider: process.env.AI_PROVIDER || 'groq',
  aiEnableFallback: process.env.AI_ENABLE_FALLBACK === 'true',
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,

  // External tool API keys — passed to agent module's tool router only
  openweatherApiKey: process.env.OPENWEATHER_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,

  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173'],

  // Rate limiting
  maxTasksPerMinute: parseInt(process.env.MAX_TASKS_PER_MINUTE, 10) || 5,

  // Execution limits (from docs/08-SECURITY.md §5)
  maxStepsPerTask: 10,
  stepTimeoutMs: 30000,
  taskTimeoutMs: 300000,
  maxRetriesPerStep: 2,
};

/**
 * Validate that required configuration is present.
 * Called once at server startup.
 */
function validateConfig() {
  const required = [
    ['SUPABASE_URL', config.supabaseUrl],
    ['SUPABASE_SERVICE_ROLE_KEY', config.supabaseServiceRoleKey],
  ];

  const missing = required.filter(([, value]) => !value);

  if (missing.length > 0) {
    const names = missing.map(([name]) => name).join(', ');
    console.error(`[Config] Missing required environment variables: ${names}`);
    if (!config.isDev) {
      process.exit(1);
    }
    console.warn('[Config] Running in dev mode with missing vars — some features will fail');
  }
}

module.exports = { config, validateConfig };
