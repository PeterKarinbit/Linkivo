import OpenAI from "openai";

// Initialize with DeepSeek configuration
const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error('❌ Error: DEEPSEEK_API_KEY is not set in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.deepseek.com/v1',
});

const PROMPTS = [
  // 1. Emphasize Synonyms and Professional Tone
  "Rewrite the following resume to use more professional and varied language. Replace repetitive words with synonyms, improve sentence structure, and enhance clarity and impact. Do not add or remove content. Return only the improved resume text.\n\nResume:\n",
  // 2. Focus on Action Verbs and Achievements
  "Reword the following resume to highlight achievements and use strong action verbs. Make the language more dynamic and professional, and improve clarity. Do not add or remove content. Return only the improved resume text.\n\nResume:\n",
  // 3. Make it ATS-Friendly and Concise
  "Rephrase the following resume to be more concise, ATS-friendly, and impactful. Use clear, professional language and avoid repetition. Do not add or remove content. Return only the improved resume text.\n\nResume:\n",
  // 4. General Enhancement
  "Improve the following resume by rewording sentences for clarity, professionalism, and variety. Use synonyms where appropriate and enhance the overall tone. Do not add or remove content. Return only the improved resume text.\n\nResume:\n"
];

// Test function to verify the API connection
export async function testConnection() {
  try {
    console.log('Testing DeepSeek API connection...');
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Hello, World!"' }
      ],
      temperature: 0.7,
      max_tokens: 100,
    });
    
    console.log('✅ DeepSeek API is working!');
    console.log('Response:', response.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.error('❌ Error connecting to DeepSeek API:');
    console.error(error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

export async function getRewordedResume(resumeText) {
  try {
    const modelName = 'deepseek-chat';
    const promptTemplate = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    const prompt = promptTemplate + resumeText;
    
    console.log('[DEEPSEEK] Using model:', modelName);
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: "You are a professional resume editor." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });
    
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error('Error in getRewordedResume:', error.message);
    throw error;
  }
}