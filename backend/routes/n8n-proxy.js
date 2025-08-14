const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // You may need to install node-fetch

// Production n8n webhook URL
const N8N_PRODUCTION_URL = 'https://boetos.app.n8n.cloud/webhook-test/29c4ee18-de28-4fd7-960d-12bf6c803be1';

// Proxy route for n8n workflow
router.post('/trigger-n8n', async (req, res) => {
  try {
    console.log('Proxying n8n workflow request:', req.body);
    
    const response = await fetch(N8N_PRODUCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      console.error(`n8n workflow failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        success: false,
        error: `n8n workflow failed: ${response.status} ${response.statusText}`
      });
    }

    const result = await response.json();
    console.log('n8n workflow result:', result);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error proxying n8n workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger n8n workflow',
      details: error.message
    });
  }
});

// Proxy route for job scraping workflow
router.post('/trigger-job-scrape', async (req, res) => {
  try {
    console.log('Proxying job scraping request:', req.body);
    
    const response = await fetch(`${N8N_PRODUCTION_URL}/job-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      console.error(`Job scraping workflow failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        success: false,
        error: `Job scraping workflow failed: ${response.status} ${response.statusText}`
      });
    }

    const result = await response.json();
    console.log('Job scraping workflow result:', result);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error proxying job scraping workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger job scraping workflow',
      details: error.message
    });
  }
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'n8n proxy is healthy'
  });
});

module.exports = router;
