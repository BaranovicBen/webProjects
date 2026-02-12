// In-memory session storage (replace with Firebase/database in production)
const { encryptData, decryptData } = require('../utils/crypto');

class SessionStore {
  constructor() {
    this.sessions = new Map(); // sessionId -> session data
    this.joinCodes = new Map(); // joinCode -> sessionId
    this.accessLog = new Map(); // sessionId -> access attempts
  }

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    const { id, secretHash, createdAt, expiresAt, hostDeviceId, joinCode } = sessionData;
    
    this.sessions.set(id, {
      id,
      secretHash,
      createdAt,
      expiresAt,
      state: 'open',
      hostDeviceId,
      participants: [],
      constraints: {},
      payloadEncrypted: null,
      joinCode,
    });
    
    if (joinCode) {
      this.joinCodes.set(joinCode, id);
    }
    
    return this.sessions.get(id);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session by join code
   */
  async getSessionByJoinCode(joinCode) {
    const sessionId = this.joinCodes.get(joinCode);
    return sessionId ? this.sessions.get(sessionId) : null;
  }

  /**
   * Update session
   */
  async updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    Object.assign(session, updates);
    return session;
  }

  /**
   * Add participant to session
   */
  async addParticipant(sessionId, participant) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    session.participants.push(participant);
    return session;
  }

  /**
   * Update participant busy intervals
   */
  async updateParticipantIntervals(sessionId, participantId, busyIntervals) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    const participant = session.participants.find(p => p.id === participantId);
    if (!participant) return null;
    
    // Encrypt the busy intervals
    participant.busyIntervalsEncrypted = encryptData(busyIntervals);
    participant.hasUploadedData = true;
    
    return session;
  }

  /**
   * Get all participant busy intervals (decrypted)
   */
  async getParticipantIntervals(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return session.participants
      .filter(p => p.hasUploadedData)
      .map(p => ({
        participantId: p.id,
        intervals: decryptData(p.busyIntervalsEncrypted),
      }));
  }

  /**
   * Lock session (after finalization)
   */
  async lockSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    session.state = 'locked';
    session.lockedAt = Date.now();
    return session;
  }

  /**
   * Delete session (hard delete)
   */
  async deleteSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.joinCode) {
      this.joinCodes.delete(session.joinCode);
    }
    return this.sessions.delete(sessionId);
  }

  /**
   * Check if session is expired
   */
  isExpired(session) {
    return Date.now() > session.expiresAt;
  }

  /**
   * Check if session is accessible
   */
  isAccessible(session) {
    return session.state === 'open' && !this.isExpired(session);
  }

  /**
   * Log access attempt (for rate limiting)
   */
  logAccessAttempt(sessionId, ip) {
    if (!this.accessLog.has(sessionId)) {
      this.accessLog.set(sessionId, []);
    }
    this.accessLog.get(sessionId).push({ ip, timestamp: Date.now() });
  }

  /**
   * Get recent access attempts
   */
  getRecentAttempts(sessionId, windowMs) {
    const attempts = this.accessLog.get(sessionId) || [];
    const cutoff = Date.now() - windowMs;
    return attempts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (this.isExpired(session) || session.state === 'locked') {
        await this.deleteSession(sessionId);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Get session count
   */
  getSessionCount() {
    return this.sessions.size;
  }
}

// Singleton instance
const sessionStore = new SessionStore();

module.exports = sessionStore;
