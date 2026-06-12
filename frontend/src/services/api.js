const SESSION_STORAGE_KEY = 'riderelay-session';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const apiPreview = {
  signup: 'POST /api/auth/signup',
  login: 'POST /api/auth/login',
  currentUser: 'GET /api/auth/me',
  locations: 'GET /api/locations',
  riderSearch: 'GET /api/rider-routes/search',
  riderRequest: 'POST /api/rider-requests',
  captainRequests: 'GET /api/captains/:captainId/requests',
  captainDecision: 'PATCH /api/captain/requests/:requestId',
  rideStatus: 'PATCH /api/rides/:requestId/status',
  payment: 'POST /api/payments',
  review: 'POST /api/reviews'
};

export function getStoredSession() {
  try {
    return window.localStorage?.getItem(SESSION_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function getStoredApiToken() {
  try {
    const storedSession = getStoredSession();
    return storedSession ? JSON.parse(storedSession)?.token || '' : '';
  } catch {
    return '';
  }
}

export function setStoredSession(session) {
  try {
    window.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Restricted browser contexts can run without persistent login.
  }
}

export function clearStoredSession() {
  try {
    window.localStorage?.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Restricted browser contexts can still log out from the current page.
  }
}

export async function apiRequest(path, options = {}) {
  const token = getStoredApiToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error || `API request failed with ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
