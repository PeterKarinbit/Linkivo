import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: "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", // Updated API key
  baseURL: "https://openrouter.ai/api/v1"
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

export async function getRewordedResume(resumeText) {
  const modelName = "deepseek/deepseek-r1-0528:free";
  // Pick a random prompt
  const promptTemplate = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  const prompt = promptTemplate + resumeText;
  console.log('[DEEPSEEK] Using model:', modelName);
  console.log('[DEEPSEEK] Prompt sent to model:', prompt.slice(0, 500));
  const response = await openai.chat.completions.create({
    model: modelName, // Updated model name
    messages: [
      { role: "system", content: "You are a professional resume editor." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2048,
  });
  console.log('[DEEPSEEK] Full API response:', JSON.stringify(response, null, 2));
  console.log('[DEEPSEEK] Model response:', response.choices[0]?.message?.content?.slice(0, 500));
  return response.choices[0]?.message?.content || "";
} 