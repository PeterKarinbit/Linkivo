import axios from "axios";
import { api_url, REQUEST_TIMEOUT, RETRY_COUNT } from "../../config";
import store from "../store/store";
import { logout, updateToken } from "../store/authSlice";

// Helper function to normalize URL
const normalizeUrl = (url) => {
  // Remove any leading slashes to prevent double slashes
  return url.replace(/^\/+/, '');
};

// Create axios instance with default configuration
const instance = axios.create({
  baseURL: api_url,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Function to refresh the access token
const refreshToken = async () => {
  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (!storedRefreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${api_url}/api/v1/user/refresh-token`, {
    refreshToken: storedRefreshToken
  }, {
    withCredentials: true
  });

  if (response.data?.data?.accessToken) {
    const newAccessToken = response.data.data.accessToken;
    const newRefreshToken = response.data.data.refreshToken;

    // Update localStorage
    localStorage.setItem('accessToken', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    // Update Redux store
    store.dispatch(updateToken({ token: newAccessToken }));

    return newAccessToken;
  }

  throw new Error('Failed to refresh token');
};

// Request interceptor to normalize URLs
instance.interceptors.request.use(config => {
  // Ensure URLs are properly formatted
  if (config.url) {
    // Don't modify absolute URLs
    if (!config.url.startsWith('http')) {
      // Remove leading slashes first
      let normalizedUrl = config.url.replace(/^\/+/, '');
      
      // Check if URL already contains /api/v1 (case-insensitive)
      const hasApiV1 = /^api\/v1\//i.test(normalizedUrl);
      
      if (hasApiV1) {
        // URL already has /api/v1, just ensure it starts with /
        config.url = `/${normalizedUrl}`;
      } else {
        // URL doesn't have /api/v1, add it
        config.url = `/api/v1/${normalizedUrl}`;
      }
    }
  }
  return config;
});

// Request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    // Try to get token from Redux state first, then fall back to localStorage
    const token = state.auth?.token || localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Response interceptor for global error handling with automatic token refresh
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiry - attempt refresh before logging out
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorMessage = error.response.data?.message;

      // Only attempt refresh for token expired errors
      if (errorMessage === "TokenExpiredError" || errorMessage === "jwt expired") {
        if (isRefreshing) {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshToken();
          processQueue(null, newToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          console.error('Token refresh failed:', refreshError);

          // Clear auth and redirect to login
          store.dispatch(logout());
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.replace("/login");

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else if (errorMessage === "Unauthorized" || errorMessage === "Invalid token") {
        // Non-refreshable auth error - just logout
        store.dispatch(logout());
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

// Main API call function with retry logic
export async function apiCall(method, url, data, config = {}) {
  let retryCount = 0;

  while (retryCount < RETRY_COUNT) {
    try {
      console.log(`Making ${method.toUpperCase()} request to ${url}`, { data, attempt: retryCount + 1 });

      let response;

      // Handle different HTTP methods
      switch (method.toLowerCase()) {
        case 'get':
          response = await instance.get(url, config);
          break;
        case 'post':
          response = await instance.post(url, data, config);
          break;
        case 'put':
          response = await instance.put(url, data, config);
          break;
        case 'patch':
          response = await instance.patch(url, data, config);
          break;
        case 'delete':
          response = await instance.delete(url, config);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      console.log(`Response from ${url}:`, response.data);

      // Return standardized response format
      return {
        ...response.data,  // Backend response (statusCode, data, message, success)
        status: response.status,  // Add axios status for compatibility
        statusText: response.statusText,
        headers: response.headers
      };

    } catch (error) {
      console.error(`Error in ${method.toUpperCase()} ${url} (attempt ${retryCount + 1}):`, error.response || error);

      // Don't retry on client errors (4xx) or authentication errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        if (error.response) {
          throw {
            ...error.response.data,
            status: error.response.status,
            statusText: error.response.statusText,
            response: error.response
          };
        }
        throw error;
      }

      // Retry on server errors (5xx) or network errors
      retryCount++;
      if (retryCount >= RETRY_COUNT) {
        if (error.response) {
          throw {
            ...error.response.data,
            status: error.response.status,
            statusText: error.response.statusText,
            response: error.response
          };
        } else if (error.request) {
          // Network error
          const networkError = new Error("No response received from server. This may be due to a CORS issue or the server might not be running.");
          networkError.response = { data: { message: "Network Error" } };
          throw networkError;
        } else {
          error.response = { data: { message: error.message || "Unknown Error" } };
          throw error;
        }
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
    }
  }
}

// Convenience methods for different HTTP verbs
export const apiGet = (url, config = {}) => apiCall('get', url, null, config);
export const apiPost = (url, data, config = {}) => apiCall('post', url, data, config);
export const apiPut = (url, data, config = {}) => apiCall('put', url, data, config);
export const apiPatch = (url, data, config = {}) => apiCall('patch', url, data, config);
export const apiDelete = (url, config = {}) => apiCall('delete', url, null, config);

// Export the axios instance as apiBase (for backward compatibility)
export const apiBase = instance;

// Default export
export default instance;