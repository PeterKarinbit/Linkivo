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
  const url = `${api_url}/api/v1/notifications/stream${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`;
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


