import express from 'express';
const router = express.Router();

// Debug endpoint to see what n8n receives
router.post('/debug-n8n', (req, res) => {
  console.log('🔍 DEBUG: Data received from n8n webhook');
  console.log('📋 Headers:', req.headers);
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  console.log('🔑 Session ID in body:', req.body.sessionId);
  console.log('🔑 Session Token in body:', req.body.sessionToken);
  console.log('👤 User ID in body:', req.body.userId);
  
  res.json({
    success: true,
    message: 'Debug data received',
    receivedData: {
      sessionId: req.body.sessionId,
      sessionToken: req.body.sessionToken,
      userId: req.body.userId,
      hasResume: !!req.body.resume,
      hasSkills: !!req.body.skills,
      allKeys: Object.keys(req.body)
    }
  });
});

// Test endpoint to simulate n8n webhook
router.post('/test-n8n-send', async (req, res) => {
  try {
    const testData = {
      resume: 'Test resume content...',
      userId: 'test_user',
      skills: 'JavaScript,React',
      experience: '3'
    };

    const sessionToken = `${Date.now()}_${testData.userId}`;
    const payload = {
      sessionId: sessionToken,
      sessionToken: sessionToken,
      timestamp: new Date().toISOString(),
      ...testData
    };

    console.log('📤 Sending test payload to n8n:');
    console.log(JSON.stringify(payload, null, 2));

    // Send to your actual n8n webhook
    const response = await fetch('https://boetos.app.n8n.cloud/webhook-test/29c4ee18-de28-4fd7-960d-12bf6c803be1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    res.json({
      success: true,
      n8nResponse: result,
      sentPayload: payload
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 