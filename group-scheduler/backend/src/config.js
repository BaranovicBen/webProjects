// Configuration for the backend server
module.exports = {
  port: process.env.PORT || 3000,
  sessionTTL: parseInt(process.env.SESSION_TTL) || 24 * 60 * 60 * 1000, // 24 hours default
  tokenLength: 32, // 256 bits for session tokens
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32char',
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 100,
  saltRounds: 10,
};
