import axios from 'axios';
import qs from 'qs';

const AUTH_CACHE = {};

// API credentials
const CREDENTIALS = {
  clientId: 'nlr7saayv3c4grgc',
  clientSecret: 'GvYwAIKk',
  tokenUrl: 'https://auth.emsicloud.com/connect/token'
};

/**
 * Get an OAuth2 token with the specified scope
 * @param {string} scope - The scope to request (default: 'emsi_open' as per credentials)
 * @returns {Promise<string>} - Access token
 */
export async function getAuthToken(scope = 'emsi_open') {
  const cacheKey = scope || 'default';
  
  // Return cached token if it's still valid
  if (AUTH_CACHE[cacheKey] && AUTH_CACHE[cacheKey].expiresAt > Date.now()) {
    console.log('Using cached token');
    return AUTH_CACHE[cacheKey].token;
  }

  console.log(`Requesting new token with scope: ${scope}`);
  
  try {
    const authResponse = await axios({
      method: 'post',
      url: CREDENTIALS.tokenUrl,
      data: qs.stringify({
        client_id: CREDENTIALS.clientId,
        client_secret: CREDENTIALS.clientSecret,
        grant_type: 'client_credentials',
        scope: scope
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in } = authResponse.data;
    const expiresAt = Date.now() + (expires_in * 1000) - 30000; // 30s buffer

    // Cache the token
    AUTH_CACHE[cacheKey] = {
      token: access_token,
      expiresAt
    };

    return access_token;
  } catch (error) {
    console.error('Failed to get auth token:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    throw new Error(`Authentication failed: ${error.message}`);
  }
}
