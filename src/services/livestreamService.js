import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://127.0.0.1:8001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Livestream API functions
export const livestreamAPI = {
  // Create a new livestream
  createLivestream: async (data) => {
    const response = await api.post('/api/livestream/streams/', data);
    return response.data;
  },

  // Get livestream by ID
  getLivestream: async (id) => {
    const response = await api.get(`/api/livestream/streams/${id}/`);
    return response.data;
  },

  // Get all active livestreams
  getActiveLivestreams: async () => {
    try {
      const response = await api.get('/api/livestream/streams/active/');
      return response.data;
    } catch (error) {
      // Return empty array on error to prevent app crash
      console.error('Failed to fetch active livestreams:', error?.response?.status || error.message);
      return [];
    }
  },

  // Get user's livestreams
  getUserLivestreams: async () => {
    const response = await api.get('/api/livestream/streams/');
    return response.data;
  },

  // Start a livestream
  startLivestream: async (id) => {
    const response = await api.post(`/api/livestream/streams/${id}/start/`);
    return response.data;
  },

  // End a livestream
  endLivestream: async (id) => {
    const response = await api.post(`/api/livestream/streams/${id}/end/`);
    return response.data;
  },

  // Check livestream status
  checkStatus: async (id) => {
    const response = await api.get(`/api/livestream/streams/${id}/status_check/`);
    return response.data;
  },

  // Get comments for a livestream
  getComments: async (livestreamId) => {
    const response = await api.get('/api/livestream/comments/', {
      params: { livestream: livestreamId }
    });
    return response.data;
  },

  // Add a comment
  addComment: async (livestreamId, comment) => {
    const response = await api.post('/api/livestream/comments/', {
      livestream: livestreamId,
      comment: comment
    });
    return response.data;
  },

  // Join a livestream (track view)
  joinLivestream: async (livestreamId) => {
    const response = await api.post('/api/livestream/views/', {
      livestream: livestreamId
    });
    return response.data;
  },

  // Leave a livestream
  leaveLivestream: async (viewId) => {
    const response = await api.post(`/api/livestream/views/${viewId}/leave/`);
    return response.data;
  },
};

export default api;
