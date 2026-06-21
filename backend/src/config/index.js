/**
 * Configuration Management — Environment Variables & Settings
 * Production-grade configuration with validation
 */
import dotenv from 'dotenv';
dotenv.config();


const config = {
  // ── Environment ──
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // ── Server ──
  port: parseInt(process.env.PORT || '5000', 10),
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // ── Database ──
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/scc_dp',
    poolSize: parseInt(process.env.MONGO_POOL_SIZE || '10', 10),
    timeout: parseInt(process.env.MONGO_TIMEOUT || '5000', 10),
    retryWrites: true,
    w: 'majority',
  },

  // ── Cache ──
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
  },

  // ── JWT ──
  jwt: {
    secret: process.env.JWT_SECRET || 'scc_dp_default_secret_change_me',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'scc_dp_refresh_secret',
    refreshExpire: process.env.REFRESH_TOKEN_EXPIRE || '30d',
  },

  // ── CORS ──
  cors: {
    origin: function (origin, callback) {
      // Bulletproof: Allow all origins dynamically to prevent Vercel/Namecheap CORS blocks
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // ── ML Services ──
  mlServices: {
    nlp: process.env.NLP_SERVICE_URL || 'http://localhost:8001',
    lstm: process.env.LSTM_SERVICE_URL || 'http://localhost:8002',
    riskEngine: process.env.RISK_ENGINE_URL || 'http://localhost:8003',
    timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '10000', 10),
  },

  // ── Email ──
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@sccadp.com',
  },

  // ── Security ──
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '15m',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
  },

  // ── API ──
  api: {
    version: process.env.API_VERSION || 'v1',
    baseUrl: process.env.API_BASE_URL || '/api/v1',
  },

  // ── Validation ──
  validate() {
    const required = ['JWT_SECRET'];
    if (this.isProd) {
      required.push('MONGO_URI', 'JWT_SECRET');
    }
    const missing = required.filter(key => !process.env[key]);
    if (missing.length) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
  },
};

// Validate on load
config.validate();

export default config;
