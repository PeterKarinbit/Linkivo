import 'dotenv/config';
import { extractTextFromFile } from './textExtraction.service.js';
import { getEmbedding } from './embedding.service.js';
import { cosineSimilarity } from './similarity.service.js';
import OpenAI from "openai";

/**
 * Analyze a document (resume, cover letter, portfolio) against a job description
 * @param {Buffer} fileBuffer - The uploaded file buffer
 * @param {string} filename - The original filename (for type detection)
 * @param {string} jobDescription - The job description text
 * @returns {Promise<{similarity: number, docText: string, jobEmbedding: number[], docEmbedding: number[]}>}
 */
export async function analyzeDocument(fileBuffer, filename, jobDescription) {
  // 1. Extract text from file (PDF, DOCX, TXT)
  const docText = await extractTextFromFile(fileBuffer, filename);
  console.log('[DEBUG] Extracted docText:', docText && docText.slice ? docText.slice(0, 200) : docText);
  if (!docText || typeof docText !== 'string' || docText.trim().length === 0) {
    throw new Error('Text extraction failed or resulted in empty string.');
  }

  // 2. Get embeddings
  const docEmbedding = await getEmbedding(docText);
  let jobEmbedding = null;
  let similarity = null;
  if (jobDescription && jobDescription.trim().length > 0) {
    jobEmbedding = await getEmbedding(jobDescription);
    similarity = cosineSimilarity(docEmbedding, jobEmbedding);
  }

  return {
    similarity,
    docText,
    jobEmbedding,
    docEmbedding,
  };
}

// New: Get AI-powered resume improvement suggestions using DeepSeek Chimera via OpenAI-compatible API
const OPENAI_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
let openai = null;
if (OPENAI_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_KEY, baseURL: "https://openrouter.ai/api/v1" });
} else {
  console.warn("[ResumeAnalysis] OpenAI/DeepSeek API key not found. Resume suggestions will be skipped.");
}

export async function getResumeImprovementSuggestions(resumeText, jobDescription) {
  // Step 1: Internally refactor/reword the resume (not shown to user)
  const refactorPrompt = `Refactor and reword the following resume to improve clarity, professionalism, and alignment with best practices. Do not add or remove content, just rephrase and improve the language. Return only the improved resume text.

Resume:
${resumeText}
`;
  const refactorRes = await openai.chat.completions.create({
    model: "deepseek/deepseek-r1-distill-qwen-32b",
    messages: [
      { role: "system", content: "You are a professional resume editor." },
      { role: "user", content: refactorPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });
  const improvedResume = refactorRes.choices[0].message.content;

  // Step 2: Ask for actionable suggestions (user sees only this)
  const suggestionPrompt = `You are a professional resume coach and recruiter. Here is a resume:
${improvedResume}

Here is a job description:
${jobDescription}

Please provide specific, actionable suggestions to improve the resume so it better matches the job description. Focus on missing skills, formatting, wording, and any other improvements that would increase the candidate's chances. Return your answer as a clear, numbered list.`;

  const suggestionRes = await openai.chat.completions.create({
    model: "deepseek/deepseek-r1-distill-qwen-32b",
    messages: [
      { role: "system", content: "You are a professional resume coach and recruiter." },
      { role: "user", content: suggestionPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return suggestionRes.choices[0].message.content;
} 