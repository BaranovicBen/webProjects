// Session service for managing sessions
const { v4: uuidv4 } = require('uuid');
const { generateToken, generateJoinCode, hashSecret, verifySecret } = require('../utils/crypto');
const { computeSharedFreeTimes } = require('../utils/intervals');
const sessionStore = require('./sessionStore');
const config = require('../config');

class SessionService {
  /**
   * Create a new session
   */
  async createSession(hostDeviceId, constraints = {}) {
    const sessionId = uuidv4();
    const secret = generateToken();
    const secretHash = await hashSecret(secret);
    const joinCode = generateJoinCode();
    const now = Date.now();
    
    const session = await sessionStore.createSession({
      id: sessionId,
      secretHash,
      createdAt: now,
      expiresAt: now + config.sessionTTL,
      hostDeviceId,
      joinCode,
    });
    
    // Update constraints
    await sessionStore.updateSession(sessionId, { constraints });
    
    return {
      sessionId,
      secret, // Return to client, never stored
      joinCode,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Join a session
   */
  async joinSession(sessionIdOrCode, secret) {
    // Try to get session by ID or join code
    let session = await sessionStore.getSession(sessionIdOrCode);
    if (!session) {
      session = await sessionStore.getSessionByJoinCode(sessionIdOrCode);
    }
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Verify secret
    const isValid = await verifySecret(secret, session.secretHash);
    if (!isValid) {
      throw new Error('Invalid secret');
    }
    
    // Check if session is accessible
    if (!sessionStore.isAccessible(session)) {
      throw new Error('Session is not accessible (locked or expired)');
    }
    
    // Generate participant ID
    const participantId = uuidv4();
    
    // Add participant
    await sessionStore.addParticipant(session.id, {
      id: participantId,
      joinedAt: Date.now(),
      hasUploadedData: false,
    });
    
    return {
      sessionId: session.id,
      participantId,
      constraints: session.constraints,
      participants: session.participants.length,
    };
  }

  /**
   * Upload busy intervals for a participant
   */
  async uploadBusyIntervals(sessionId, participantId, secret, busyIntervals) {
    const session = await sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Verify secret
    const isValid = await verifySecret(secret, session.secretHash);
    if (!isValid) {
      throw new Error('Invalid secret');
    }
    
    // Check if session is accessible
    if (!sessionStore.isAccessible(session)) {
      throw new Error('Session is not accessible');
    }
    
    // Verify participant exists
    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }
    
    // Update intervals
    await sessionStore.updateParticipantIntervals(sessionId, participantId, busyIntervals);
    
    return { success: true };
  }

  /**
   * Finalize session and compute results
   */
  async finalizeSession(sessionId, secret) {
    const session = await sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Verify secret
    const isValid = await verifySecret(secret, session.secretHash);
    if (!isValid) {
      throw new Error('Invalid secret');
    }
    
    // Check if session is accessible
    if (!sessionStore.isAccessible(session)) {
      throw new Error('Session is not accessible');
    }
    
    // Get all participant intervals
    const participantData = await sessionStore.getParticipantIntervals(sessionId);
    
    if (participantData.length === 0) {
      throw new Error('No participant data available');
    }
    
    // Extract busy intervals
    const busyIntervals = participantData.map(p => p.intervals);
    
    // Compute shared free times
    const results = computeSharedFreeTimes(busyIntervals, session.constraints);
    
    // Lock the session
    await sessionStore.lockSession(sessionId);
    
    return results;
  }

  /**
   * Get session results (after finalization)
   */
  async getResults(sessionId, secret) {
    const session = await sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Verify secret
    const isValid = await verifySecret(secret, session.secretHash);
    if (!isValid) {
      throw new Error('Invalid secret');
    }
    
    // Session must be locked to view results
    if (session.state !== 'locked') {
      throw new Error('Session not finalized');
    }
    
    // Recompute results (since we don't store them)
    const participantData = await sessionStore.getParticipantIntervals(sessionId);
    const busyIntervals = participantData.map(p => p.intervals);
    const results = computeSharedFreeTimes(busyIntervals, session.constraints);
    
    return results;
  }

  /**
   * Get session info (without sensitive data)
   */
  async getSessionInfo(sessionId) {
    const session = await sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    return {
      sessionId: session.id,
      state: session.state,
      participantCount: session.participants.length,
      participantsWithData: session.participants.filter(p => p.hasUploadedData).length,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isExpired: sessionStore.isExpired(session),
    };
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpired() {
    return sessionStore.cleanupExpired();
  }
}

module.exports = new SessionService();
