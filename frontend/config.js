// API configuration for development
// In development, we'll use the Vite proxy which forwards requests to the backend
const isDev = import.meta.env.MODE === 'development';
const baseUrl = isDev
  ? ''  // Use relative URLs in development (handled by Vite proxy)
  : (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3000');

export const api_url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

// Example for mobile access (set in .env instead):
// VITE_API_BASE_URL=http://192.168.100.8:3000

// Axios configuration constants
// Axios configuration constants
export const REQUEST_TIMEOUT = 60000; // 60 seconds timeout - increased for AI operations
export const RETRY_COUNT = 1; // Number of retries for failed requests