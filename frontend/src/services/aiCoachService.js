import { apiGet, apiPost } from "./apiBase";

export const aiCoachService = {
  createJournalEntry,
  getJournalEntries,
  processJournalEntry,
  subscribe: (userId, callbacks) => {
    // Mock implementation - in a real app, this would set up WebSocket or SSE
    console.log(`Subscribed to recommendations for user ${userId}`);
    return () => console.log(`Unsubscribed from recommendations for user ${userId}`);
  }
};

async function createJournalEntry(content, entryDate, tags = []) {
  return apiPost("/enhanced-ai-career-coach/journal", {
    content,
    entry_date: entryDate || new Date().toISOString(),
    tags,
  });
}

async function getJournalEntries({ page = 1, limit = 10, search = "" } = {}) {
  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  if (search) params.set("search", search);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return apiGet(`/enhanced-ai-career-coach/journal${qs}`);
}

/**
 * Process a journal entry and generate AI recommendations
 * @param {string} content - The journal entry content
 * @param {string} entryId - The journal entry ID
 * @returns {Promise<Object>} - The analysis and recommendations
 */
async function processJournalEntry(content, entryId) {
  try {
    const response = await apiPost('/api/v1/ai-recommendations/process-journal', {
      content,
      entryId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error processing journal entry:', error);
    throw error;
  }
}


