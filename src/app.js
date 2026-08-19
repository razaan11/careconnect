// Express application entrypoint: middleware wiring, route mounting,
// global error handling, and server startup.

const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const routes = require('./routes');
const { scheduleExpiryCheck } = require('./services/foodSafety');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'careconnect-backend' });
});

app.use('/api', routes);

// 404 handler for unmatched routes.
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global error handler. Must be declared last, with 4 args, so
// Express recognizes it as an error-handling middleware.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[global error handler]', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

scheduleExpiryCheck();

app.listen(env.PORT, () => {
  console.log(`CareConnect backend listening at http://localhost:${env.PORT}`);
});

module.exports = app;
