// Run this in your browser's console while on your web app
// This will use your current session to trigger the knowledge base update

const userId = '68ce5bc0d065dc2b4a9a0a2e';
const url = `/api/v1/ai-career-coach/mcp/test-update/${userId}`;

console.log('Triggering knowledge base update...');

fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    // The browser will automatically include the auth cookie
  },
  credentials: 'include' // This ensures cookies are sent with the request
})
.then(response => response.json())
.then(data => {
  console.log('Update result:', data);
  if (data.success) {
    console.log('✅ Knowledge base updated successfully!');
    console.log('Last updated:', data.data?.lastUpdated);
    console.log('Version:', data.data?.version);
  } else {
    console.error('❌ Failed to update knowledge base:', data.error);
  }
})
.catch(error => {
  console.error('Error triggering update:', error);
});
