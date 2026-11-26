// Every call to the API goes through this one function, so the login token,
// JSON handling and error messages are dealt with in one place.
// In production, set VITE_API_URL to the deployed API (e.g. https://mohalla-api.onrender.com/api).
const BASE = import.meta.env.VITE_API_URL || '/api';

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  // The API always sends { error: "..." } on failure; show that to the user.
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const rupees = (n) => (n == null ? '—' : `Rs ${Number(n).toLocaleString('en-PK')}`);
