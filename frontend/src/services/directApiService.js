import axios from 'axios';
import { api_url } from '../../config';

// Create an axios instance specifically for auth operations
const authAxios = axios.create({
  baseURL: api_url,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for debugging
authAxios.interceptors.request.use(
  config => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
authAxios.interceptors.response.use(
  response => {
    console.log(`[API Response] ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`, {
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('[API Response Error]', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : null,
      request: error.request ? 'Request was made but no response received' : null,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Auth service functions
export const authService = {
  // Login user and return tokens
  async login(email, password) {
    try {
      const response = await authAxios.post('/users/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Fetch current user profile
  async getCurrentUser(token) {
    try {
      const response = await authAxios.get('/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get user profile failed:', error);
      throw error;
    }
  },

  // Register a new user
  async register(userData) {
    try {
      const response = await authAxios.post('/users/signup', userData);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      const response = await authAxios.get('/users/logout');
      return response.data;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  // Check if server is reachable
  async pingServer() {
    try {
      const response = await authAxios.get('/users/ping');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};
