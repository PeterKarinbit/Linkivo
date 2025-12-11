const buildHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json'
});

export const fetchKnowledgeShelf = async (options = {}) => {
  const queryParams = options.force ? '?force=true' : '';
  const response = await fetch(`/api/v1/enhanced-ai-career-coach/knowledge-base/shelf${queryParams}`, {
    method: 'GET',
    headers: buildHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to load knowledge shelf');
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.message || 'Knowledge shelf request failed');
  }

  return payload.data;
};

export const deleteKnowledgeBaseItem = async (itemId) => {
  const response = await fetch(`/api/v1/enhanced-ai-career-coach/knowledge-base/${itemId}`, {
    method: 'DELETE',
    headers: buildHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to delete knowledge base item');
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.message || 'Delete request failed');
  }

  return payload.data;
};

export default {
  fetchKnowledgeShelf,
  deleteKnowledgeBaseItem
};
