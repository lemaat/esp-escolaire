// Utilitaire partagé pour les appels API
const API = 'http://localhost:8000';

export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

export async function apiFetch(path, options = {}) {
  const defaults = {
    credentials: 'include',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
      ...options.headers,
    },
  };

  // Ne pas mettre Content-Type si c'est FormData (le navigateur le fait)
  if (!(options.body instanceof FormData)) {
    defaults.headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API}${path}`, { ...defaults, ...options, headers: { ...defaults.headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}
