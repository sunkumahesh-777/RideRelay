import { apiRequest } from './api';

function queryString(values) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });

  return params.toString();
}

export function getLocations(limit = 500) {
  return apiRequest(`/api/locations?${queryString({ limit })}`);
}

export function searchRiderRoutes({ pickup, destination, seats }) {
  return apiRequest(`/api/rider-routes/search?${queryString({ pickup, destination, seats })}`);
}

export function getCaptainRoutes(filters = {}) {
  const query = queryString(filters);
  return apiRequest(`/api/captain-routes${query ? `?${query}` : ''}`);
}

export function createRiderRequest(request) {
  return apiRequest('/api/rider-requests', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

export function getCaptainRequests(captainId) {
  return apiRequest(`/api/captains/${captainId}/requests`);
}

export function updateCaptainRequest(requestId, update) {
  return apiRequest(`/api/captain/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(update)
  });
}

export function updateRideStatus(requestId, update) {
  return apiRequest(`/api/rides/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(update)
  });
}
