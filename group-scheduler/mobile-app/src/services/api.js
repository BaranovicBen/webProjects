// API service for backend communication
import axios from 'axios';

// Update this to your backend URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Create a new session
 */
export const createSession = async (hostDeviceId, constraints) => {
  const response = await api.post('/sessions', {
    hostDeviceId,
    constraints,
  });
  return response.data;
};

/**
 * Join a session
 */
export const joinSession = async (sessionId, secret) => {
  const response = await api.post('/sessions/join', {
    sessionId,
    secret,
  });
  return response.data;
};

/**
 * Upload busy intervals
 */
export const uploadBusyIntervals = async (sessionId, participantId, secret, busyIntervals) => {
  const response = await api.post(`/sessions/${sessionId}/intervals`, {
    participantId,
    secret,
    busyIntervals,
  });
  return response.data;
};

/**
 * Finalize session
 */
export const finalizeSession = async (sessionId, secret) => {
  const response = await api.post(`/sessions/${sessionId}/finalize`, {
    secret,
  });
  return response.data;
};

/**
 * Get session results
 */
export const getResults = async (sessionId, secret) => {
  const response = await api.get(`/sessions/${sessionId}/results`, {
    params: { secret },
  });
  return response.data;
};

/**
 * Get session info
 */
export const getSessionInfo = async (sessionId) => {
  const response = await api.get(`/sessions/${sessionId}/info`);
  return response.data;
};

export default api;
