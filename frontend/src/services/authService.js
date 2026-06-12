import { apiRequest } from './api';

export function getCurrentUser() {
  return apiRequest('/api/auth/me');
}

export function login(credentials) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export function signup(account) {
  return apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(account)
  });
}
