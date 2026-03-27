const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function buildUrl(path) {
  const base = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let message = `Request failed with status ${response.status}`;

    if (contentType.includes('application/json')) {
      const payload = await response.json();
      message = payload?.error?.message || payload?.detail || message;
    } else {
      const text = await response.text();
      if (text) message = text;
    }

    throw new Error(message);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
