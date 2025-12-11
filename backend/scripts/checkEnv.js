import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Check if the API key is loaded
console.log('🔍 Environment Check:');
console.log('-------------------');
console.log(`Current directory: ${__dirname}`);
console.log(`Loading .env from: ${envPath}`);
console.log(`GEMINI_API_KEY exists: ${!!process.env.GEMINI_API_KEY}`);
console.log(`GEMINI_API_KEY length: ${process.env.GEMINI_API_KEY?.length || 0} characters`);
console.log(`First 5 chars: ${process.env.GEMINI_API_KEY?.substring(0, 5) || 'N/A'}...`);

// Try to initialize the Gemini API
if (process.env.GEMINI_API_KEY) {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('\n✅ Successfully initialized Google Generative AI');
  } catch (error) {
    console.error('\n❌ Error initializing Google Generative AI:', error.message);
  }
} else {
  console.log('\n❌ GEMINI_API_KEY is not set in the environment variables');
}
