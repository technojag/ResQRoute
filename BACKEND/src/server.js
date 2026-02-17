'use strict';
require('dotenv').config();   // load .env FIRST

/* ── sanity check ── */
if (!process.env.JWT_SECRET) {
  console.error('\n❌  JWT_SECRET missing in .env  →  add it and restart\n');
  process.exit(1);
}

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const mongoose   = require('mongoose');
const logger     = require('./utils/logger');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── middleware ── */
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── health (always works, even without DB) ── */
app.get('/health', (_req, res) => res.json({
  status : 'OK',
  time   : new Date().toISOString(),
  uptime : process.uptime(),
  db     : mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

/* ── load routes safely ── */
try {
  const routes = require('./api/routes');
  app.use('/api/v1', routes);
  logger.info('Routes loaded ✅');
} catch (e) {
  logger.error('Routes failed to load: ' + e.message);
  console.error('\n❌  Route load error:', e.message, '\n');
}

/* ── 404 ── */
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

/* ── error handler ── */
app.use((err, _req, res, _next) => {
  logger.error('Global error: ' + err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

/* ── connect MongoDB (non-fatal) ── */
(async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info('MongoDB connected ✅');
    } catch (e) {
      logger.warn('MongoDB skipped: ' + e.message);
    }
  } else {
    logger.warn('MONGODB_URI not set — skipping DB');
  }

  /* ── start HTTP server ── */
  app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   ✅  ResQRoute Backend  RUNNING          ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`  🌐  URL    : http://localhost:${PORT}`);
    console.log(`  ❤️   Health : http://localhost:${PORT}/health`);
    console.log(`  📡  Mode   : ${process.env.NODE_ENV || 'development'}\n`);
  });
})();

process.on('unhandledRejection', e => logger.error('UnhandledRejection: ' + e.message));
process.on('uncaughtException',  e => logger.error('UncaughtException: '  + e.message));