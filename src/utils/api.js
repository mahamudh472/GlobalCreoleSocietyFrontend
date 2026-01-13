import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

/**
 * Decode JWT token and check if it's expired
 * @param {string} token - JWT token
 * @returns {boolean} - true if token is valid and not expired
 */
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiry and if it's still valid
    // Add 10 second buffer to account for clock skew
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > (now + 10);
    }
    
    return false;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create a public axios instance (for unauthenticated requests)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          // No refresh token - clear everything and notify
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event('auth-failed'));
          return Promise.reject(error);
        }

        // Check if refresh token is valid before attempting refresh
        if (!isTokenValid(refreshToken)) {
          console.log('Refresh token is expired - logging out');
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event('auth-failed'));
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_BASE_URL}/accounts/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem("access_token", access);

        // Update refresh token if provided (token rotation)
        if (response.data.refresh) {
          localStorage.setItem("refresh_token", response.data.refresh);
        }

        // Dispatch custom event to notify AuthContext of successful refresh
        window.dispatchEvent(new Event('token-refreshed'));

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and notify AuthContext
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        // Dispatch event to notify AuthContext
        window.dispatchEvent(new Event('auth-failed'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to handle multipart/form-data requests
export const createFormData = (data) => {
  const formData = new FormData();

  Object.keys(data).forEach((key) => {
    const value = data[key];

    // Handle arrays (like multiple files)
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item instanceof File) {
          formData.append(`${key}[]`, item);
        } else {
          formData.append(`${key}[]`, item);
        }
      });
    }
    // Handle single file
    else if (value instanceof File) {
      formData.append(key, value);
    }
    // Handle regular values
    else if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });

  return formData;
};

// API methods for easy use
export const apiMethods = {
  // GET request
  get: (url, config = {}) => api.get(url, config),

  // POST request (JSON)
  post: (url, data, config = {}) => api.post(url, data, config),

  // POST request (FormData)
  postForm: (url, data, config = {}) => {
    const formData = createFormData(data);
    return api.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // PUT request
  put: (url, data, config = {}) => api.put(url, data, config),

  // PATCH request
  patch: (url, data, config = {}) => api.patch(url, data, config),

  // DELETE request
  delete: (url, config = {}) => api.delete(url, config),
};

// Public API methods (no authentication required)
export const publicApiMethods = {
  // GET request (public, no auth token)
  get: (url, config = {}) => publicApi.get(url, config),
};


// Authentication helpers
export const authHelpers = {
  // Login
  login: async (email, password) => {
    const response = await api.post("/accounts/login/", { email, password });
    if (response.data.tokens) {
      localStorage.setItem("access_token", response.data.tokens.access);
      localStorage.setItem("refresh_token", response.data.tokens.refresh);
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post("/accounts/register/", userData);
    if (response.data.tokens) {
      localStorage.setItem("access_token", response.data.tokens.access);
      localStorage.setItem("refresh_token", response.data.tokens.refresh);
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await api.post("/accounts/logout/", { refresh: refreshToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local storage even if API call fails
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("access_token");
  },

  // Validate if token is not expired
  isTokenValid: () => {
    const token = localStorage.getItem("access_token");
    return isTokenValid(token);
  },

  // Attempt to refresh token
  attemptTokenRefresh: async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        return false;
      }

      // Check if refresh token is valid
      if (!isTokenValid(refreshToken)) {
        // Refresh token is also expired, clear everything
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        return false;
      }

      const response = await axios.post(
        `${API_BASE_URL}/accounts/token/refresh/`,
        { refresh: refreshToken }
      );

      const { access } = response.data;
      localStorage.setItem("access_token", access);
      
      // Update refresh token if provided (token rotation)
      if (response.data.refresh) {
        localStorage.setItem("refresh_token", response.data.refresh);
      }

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Clear tokens on refresh failure
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      return false;
    }
  },
};

export default api;
