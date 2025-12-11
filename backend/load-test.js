import axios from 'axios';
import { createInterface } from 'readline';

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password'
};

// Simple test data
const TEST_JOURNAL_ENTRY = `
  Today I worked on a React project and implemented a new feature using hooks.
  I'm feeling a bit stuck with the performance optimization part.
  I need to learn more about useMemo and useCallback.
  My goal is to become a senior frontend developer in the next year.
`;

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/users/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testJournalEntry(token) {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/ai-coach/journal`,
      { content: TEST_JOURNAL_ENTRY },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Journal entry created:', response.data.entry_id);
    return response.data;
  } catch (error) {
    console.error('Journal entry failed:', error.response?.data || error.message);
  }
}

async function runTest() {
  console.log('Starting load test...');
  
  // Login to get token
  console.log('Logging in...');
  const token = await login();
  
  // Run tests in a loop
  let count = 0;
  const interval = setInterval(async () => {
    count++;
    console.log(`\nTest ${count}: Creating journal entry`);
    await testJournalEntry(token);
  }, 5000); // Run every 5 seconds
  
  // Stop after 10 tests or on user input
  setTimeout(() => {
    clearInterval(interval);
    console.log('\nTest completed');
    process.exit(0);
  }, 60000); // Run for 1 minute
  
  // Allow manual stop
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Press enter to stop the test...', () => {
    clearInterval(interval);
    rl.close();
    process.exit(0);
  });
}

runTest().catch(console.error);
