// Simple integration test for GET /api/v1/subscription/usage
// Usage: BASE_URL=http://localhost:3000 TOKEN=your_jwt node test-subscription-usage.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error('Missing TOKEN env var. Example: TOKEN=ey... node test-subscription-usage.js');
  process.exit(1);
}

async function main() {
  const url = `${BASE_URL}/api/v1/subscription/usage`;
  console.log('GET', url);
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/json'
    },
    credentials: 'include'
  });
  console.log('Status:', res.status, res.statusText);
  const body = await res.json().catch(() => ({}));
  console.log('Body:', JSON.stringify(body, null, 2));

  if (!res.ok) process.exit(2);
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});


