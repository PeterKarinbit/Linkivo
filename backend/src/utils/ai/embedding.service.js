import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

/**
 * Get embedding vector for a given text using Google Gemini API
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector
 */
export async function getEmbedding(text) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Gemini API key is missing. Set GEMINI_API_KEY in your .env file.');
  if (!text || typeof text !== 'string') throw new Error('Text must be a non-empty string');
  console.log('Getting embedding for text:', text.substring(0, 50) + '...');
  const result = await model.embedContent(text, { outputDimensionality: 768 });
  console.log('Embedding result structure:', Object.keys(result));
  console.log('Embedding values length:', result.embedding?.values?.length);
  return result.embedding.values;
} 