// Session routes
const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const { asyncHandler } = require('../middleware/errorHandler');
const { createSessionLimiter, joinLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/sessions
 * Create a new session
 */
router.post('/', createSessionLimiter, asyncHandler(async (req, res) => {
  const { hostDeviceId, constraints } = req.body;
  
  if (!hostDeviceId) {
    return res.status(400).json({ error: 'hostDeviceId is required' });
  }
  
  const result = await sessionService.createSession(hostDeviceId, constraints);
  
  res.status(201).json(result);
}));

/**
 * POST /api/sessions/join
 * Join an existing session
 */
router.post('/join', joinLimiter, asyncHandler(async (req, res) => {
  const { sessionId, secret } = req.body;
  
  if (!sessionId || !secret) {
    return res.status(400).json({ error: 'sessionId and secret are required' });
  }
  
  const result = await sessionService.joinSession(sessionId, secret);
  
  res.status(200).json(result);
}));

/**
 * POST /api/sessions/:sessionId/intervals
 * Upload busy intervals for a participant
 */
router.post('/:sessionId/intervals', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { participantId, secret, busyIntervals } = req.body;
  
  if (!participantId || !secret || !busyIntervals) {
    return res.status(400).json({ 
      error: 'participantId, secret, and busyIntervals are required' 
    });
  }
  
  if (!Array.isArray(busyIntervals)) {
    return res.status(400).json({ error: 'busyIntervals must be an array' });
  }
  
  const result = await sessionService.uploadBusyIntervals(
    sessionId,
    participantId,
    secret,
    busyIntervals
  );
  
  res.status(200).json(result);
}));

/**
 * POST /api/sessions/:sessionId/finalize
 * Finalize session and compute results
 */
router.post('/:sessionId/finalize', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { secret } = req.body;
  
  if (!secret) {
    return res.status(400).json({ error: 'secret is required' });
  }
  
  const results = await sessionService.finalizeSession(sessionId, secret);
  
  res.status(200).json(results);
}));

/**
 * GET /api/sessions/:sessionId/results
 * Get session results (after finalization)
 */
router.get('/:sessionId/results', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { secret } = req.query;
  
  if (!secret) {
    return res.status(400).json({ error: 'secret is required' });
  }
  
  const results = await sessionService.getResults(sessionId, secret);
  
  res.status(200).json(results);
}));

/**
 * GET /api/sessions/:sessionId/info
 * Get session info (public, no secret required)
 */
router.get('/:sessionId/info', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  const info = await sessionService.getSessionInfo(sessionId);
  
  res.status(200).json(info);
}));

module.exports = router;
