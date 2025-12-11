import axios from 'axios';
import { OpenAI } from 'openai';

// Lightweight publish hook to notifications router
export async function publishNotification({ baseUrl, userId, title, body, kind = 'insight' }) {
  const url = `${baseUrl}/api/v1/notifications/publish${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`;
  await axios.post(url, { title, body, kind }, { timeout: 5000 });
}

export async function generateProactiveMessage({ userContext, fallback }) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error('Missing API key');
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultHeaders: (() => {
        const headers = {};
        if ((process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').includes('openrouter.ai')) {
          if (process.env.OPENROUTER_SITE_URL) headers['HTTP-Referer'] = process.env.OPENROUTER_SITE_URL;
          if (process.env.OPENROUTER_APP_NAME) headers['X-Title'] = process.env.OPENROUTER_APP_NAME;
        }
        return headers;
      })()
    });
    const prompt = `You are Linkivo, a friendly AI career coach. In 1-2 sentences, proactively reach out to the user with a helpful, actionable nudge. Keep it warm and specific to their context.
Context: ${JSON.stringify(userContext)}
Return JSON: {"title": string, "body": string}`;
    const resp = await client.chat.completions.create({
      model: process.env.AI_RECOMMENDER_MODEL || 'deepseek/deepseek-chat-v3.1:free',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });
    const text = resp.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(text);
    if (parsed?.title && parsed?.body) return parsed;
    throw new Error('Invalid LLM response');
  } catch (_) {
    return fallback || { title: 'Fresh tip from Linkivo', body: 'Take 10 minutes to jot down a quick win from today. Small reflections compound into big progress.' };
  }
}

export async function runProactiveNotifier({ baseUrl, users }) {
  for (const user of users) {
    const msg = await generateProactiveMessage({
      userContext: {
        name: user.name,
        lastActivity: user.lastActivity,
        goals: user.goals?.slice(0, 3) || []
      },
      fallback: undefined,
    });
    await publishNotification({ baseUrl, userId: user.id, title: msg.title, body: msg.body });
  }
}


