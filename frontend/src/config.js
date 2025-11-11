// Backend API configuration
export const API_BASE_URL = 'https://live-video-sync-backend.onrender.com';

// API endpoints
export const API_ENDPOINTS = {
  CREATE_SESSION: `${API_BASE_URL}/api/create-session`,
  GET_SESSION: (uniqueId) => `${API_BASE_URL}/api/session/${uniqueId}`,
  JOIN_SESSION: (uniqueId) => `${API_BASE_URL}/api/join-session/${uniqueId}`,
  UPLOAD_VIDEO: (uniqueId) => `${API_BASE_URL}/api/upload-video/${uniqueId}`,
};

// Socket.io server URL
export const SOCKET_URL = API_BASE_URL;

