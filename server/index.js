const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initDb } = require('./db/connection');
const { startCron } = require('./services/sync');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing: raw for webhook signature verification, JSON for everything else
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Rate limiting
const { apiLimiter, webhookLimiter } = require('./middleware/rate-limit');
app.use('/api', apiLimiter);
app.use('/webhook', webhookLimiter);

// Input sanitization
const { sanitize } = require('./middleware/sanitize');
app.use(sanitize);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/events', require('./routes/events'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/senderids', require('./routes/senderids'));
app.use('/webhook', require('./routes/webhook'));
app.use('/oauth', require('./routes/oauth'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function start() {
  await initDb();
  startCron();
  app.listen(PORT, () => {
    console.log(`kwtsms-zendesk server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
