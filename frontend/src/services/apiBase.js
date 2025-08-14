import axios from "axios";
import { api_url, REQUEST_TIMEOUT, RETRY_COUNT } from "../../config";
import store from "../store/store";
import { logout } from "../store/authSlice";

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

// Request interceptor to add auth token
instance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth?.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiry globally
    if (error.response?.status === 401) {
      const errorMessage = error.response.data?.message;
      if (errorMessage === "TokenExpiredError" || errorMessage === "Unauthorized") {
        store.dispatch(logout());
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