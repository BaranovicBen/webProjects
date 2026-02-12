// Main Express server
const express = require('express');
const cors = require('cors');
const config = require('./config');
const sessionRoutes = require('./routes/sessions');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const sessionService = require('./services/sessionService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/sessions', sessionRoutes);

// Error handling
app.use(errorHandler);

// Cleanup expired sessions every hour
setInterval(async () => {
  try {
    const cleaned = await sessionService.cleanupExpired();
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired sessions`);
    }
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
}, 60 * 60 * 1000);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
