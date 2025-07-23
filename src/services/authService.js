import axios from 'axios';
import { API_ENDPOINTS, ERROR_MESSAGES, STORAGE_KEYS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5090';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     ERROR_MESSAGES.DEFAULT;
      throw new Error(message);
    }
  },

  // Register new user
  async register(userData) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      const { token, user } = response.data;
      
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     ERROR_MESSAGES.DEFAULT;
      throw new Error(message);
    }
  },

  // Logout user
  async logout() {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  // Get current user
  getCurrentUser() {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  // Get auth token
  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  // Refresh token
  async refreshToken() {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REFRESH);
      const { token } = response.data;
      
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      }
      
      return token;
    } catch (error) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }
  },

  // Get user profile
  async getProfile() {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
      const user = response.data;
      
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    } catch (error) {
      throw new Error(error.response?.data?.message || ERROR_MESSAGES.DEFAULT);
    }
  }
};
