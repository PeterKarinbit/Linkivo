import { api_url } from "../../config";
import { apiGet, apiPost } from "./apiBase";

export const notificationsService = {
  list,
  markRead,
  subscribe,
  publishDemo,
};

async function list(userId) {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return apiGet(`/notifications${qs}`);
}

async function markRead(ids, userId) {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return apiPost(`/notifications/mark-read${qs}`, { ids });
}

function subscribe({ userId, onEvent, onError }) {
  const token = localStorage.getItem('accessToken');
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const authQs = token ? `${qs ? '&' : '?'}token=${encodeURIComponent(token)}` : qs;

  // Ensure we don't have double '?' if only token is present
  const finalQs = qs && token ? `${qs}&token=${encodeURIComponent(token)}` : (qs || (token ? `?token=${encodeURIComponent(token)}` : ''));

  // Simplified logic: build params
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (token) params.append('token', token);

  const url = `${api_url}/api/v1/notifications/stream?${params.toString()}`;

  const source = new EventSource(url, { withCredentials: true });
  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent?.(data);
    } catch (e) {
      // ignore
    }
  };
  source.onerror = (err) => {
    onError?.(err);
  };
  return () => source.close();
}

async function publishDemo({ title, body, kind, userId }) {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return apiPost(`/notifications/publish${qs}`, { title, body, kind });
}


