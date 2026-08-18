const express = require('express');
const { validateReleaseGate } = require('./policy');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/**
 * POST /release-gate
 * Endpoint that decides whether a GitHub Actions run may promote a container image
 */
app.post('/release-gate', (req, res) => {
  try {
    const result = validateReleaseGate(req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Release Gate service listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
