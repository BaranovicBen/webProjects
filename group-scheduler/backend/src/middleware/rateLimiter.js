// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const config = require('../config');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for session creation
const createSessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 sessions per hour per IP
  message: 'Too many sessions created, please try again later.',
});

// Stricter rate limiter for join attempts (prevent brute force)
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 join attempts per 15 minutes
  message: 'Too many join attempts, please try again later.',
});

module.exports = {
  apiLimiter,
  createSessionLimiter,
  joinLimiter,
};
