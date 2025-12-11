import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from different locations
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env')
];

console.log('🔍 Checking environment variables...');
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);

for (const envPath of envPaths) {
  console.log('\nTrying to load:', envPath);
  try {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.log('  ❌ Error:', result.error.message);
    } else {
      console.log('  ✅ Successfully loaded .env file');
      console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'NOT SET');
      console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
      break;
    }
  } catch (error) {
    console.log('  ❌ Failed to load:', error.message);
  }
}

// Also check process.env directly
console.log('\nProcess environment variables:');
console.log('GEMINI_API_KEY from process.env:', process.env.GEMINI_API_KEY ? '***' + process.env.GEMINI_API_KEY.slice(-4) : 'NOT SET');
console.log('NODE_ENV from process.env:', process.env.NODE_ENV || 'development');
