// n8n Service for workflow integration

// Use import.meta.env for Vite or window.location for fallback
// Note: The production URL has CORS issues, using local fallback
const N8N_WEBHOOK_URL = import.meta.env?.VITE_N8N_WEBHOOK_URL || 
                       'http://127.0.0.1:5678/webhook/0572edee-3d5d-48ec-bc40-0fc8653eb0b5';

// Production webhook URL that has CORS issues: https://boetos.app.n8n.cloud/webhook-test/29c4ee18-de28-4fd7-960d-12bf6c803be1
const N8N_PRODUCTION_URL = 'https://boetos.app.n8n.cloud/webhook-test/29c4ee18-de28-4fd7-960d-12bf6c803be1';

// Helper function for retry logic
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} to call ${url}`);
      const response = await fetch(url, options);
      
      // Check for network/CORS errors first
      if (!response.ok) {
        if (response.status === 0 || response.status === 405) {
          throw new Error(`CORS or network error (status: ${response.status}). This usually means the n8n webhook doesn't have proper CORS headers configured.`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      // Don't retry CORS errors as they won't resolve with retries
      if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, i) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

export const triggerN8nWorkflow = async (data) => {
  try {
    console.log('Triggering n8n workflow with data:', data);
    
    // Generate a unique session ID for this workflow run
    const sessionId = `${Date.now()}_${data.userId || 'guest'}`;
    
    const requestBody = {
      sessionId: sessionId,
      userId: data.userId,
      resume: data.resume,
      skills: data.skills,
      experience: data.experience,
      scrapedJobs: data.scrapedJobs,
      preferences: data.preferences,
      autoRefactor: data.autoRefactor,
      timestamp: new Date().toISOString()
    };
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(requestBody)
    };

    try {
      // Try direct n8n webhook first
      const response = await fetchWithRetry(N8N_WEBHOOK_URL, requestOptions);
      const result = await response.json();
      
      console.log('n8n workflow result:', result);
      return result;
    } catch (directError) {
      console.warn('Direct n8n call failed, trying backend proxy:', directError.message);
      
      // If direct call fails due to CORS, try backend proxy
      if (directError.message.includes('CORS') || directError.message.includes('NetworkError')) {
        try {
          const proxyResponse = await fetch('/api/n8n-proxy/trigger-n8n', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(requestBody)
          });
          
          if (!proxyResponse.ok) {
            throw new Error(`Proxy request failed: ${proxyResponse.status}`);
          }
          
          const proxyResult = await proxyResponse.json();
          console.log('n8n workflow result via proxy:', proxyResult);
          return proxyResult.data;
        } catch (proxyError) {
          console.error('Backend proxy also failed:', proxyError);
          throw new Error(
            'Both direct n8n call and backend proxy failed. ' +
            'Please check n8n configuration and backend proxy setup.'
          );
        }
      }
      
      // Re-throw original error if it's not a CORS issue
      throw directError;
    }
  } catch (error) {
    console.error('Error triggering n8n workflow:', error);
    
    // Provide helpful error message for common issues
    if (error.message.includes('CORS')) {
      const helpfulError = new Error(
        'CORS Error: The n8n webhook is not configured to allow requests from this domain. ' +
        'Please configure the n8n webhook to include proper CORS headers or use a backend proxy.'
      );
      helpfulError.originalError = error;
      throw helpfulError;
    }
    
    if (error.message.includes('NetworkError')) {
      const helpfulError = new Error(
        'Network Error: Unable to reach the n8n webhook. Please check if the webhook URL is correct and accessible.'
      );
      helpfulError.originalError = error;
      throw helpfulError;
    }
    
    throw error;
  }
};

export const triggerJobScrapingWorkflow = async (searchParams) => {
  try {
    console.log('Triggering job scraping workflow with params:', searchParams);
    
    // Generate a unique session ID for this workflow run
    const sessionId = `${Date.now()}_${searchParams.userId || 'guest'}`;
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({
        sessionId: sessionId,
        ...searchParams
      })
    };

    const response = await fetchWithRetry(N8N_WEBHOOK_URL + '/job-scrape', requestOptions);
    const result = await response.json();
    
    console.log('Job scraping workflow result:', result);
    return result;
  } catch (error) {
    console.error('Error triggering job scraping workflow:', error);
    
    // Provide helpful error message for common issues
    if (error.message.includes('CORS')) {
      const helpfulError = new Error(
        'CORS Error: The job scraping webhook is not configured to allow requests from this domain. ' +
        'Please configure the n8n webhook to include proper CORS headers or use a backend proxy.'
      );
      helpfulError.originalError = error;
      throw helpfulError;
    }
    
    if (error.message.includes('NetworkError')) {
      const helpfulError = new Error(
        'Network Error: Unable to reach the job scraping webhook. Please check if the webhook URL is correct and accessible.'
      );
      helpfulError.originalError = error;
      throw helpfulError;
    }
    
    throw error;
  }
};
