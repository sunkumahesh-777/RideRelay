const PUBLIC_RIDE_ROUTES = {
  GET: [
    '/api/health',
    '/api/locations',
    '/api/captain-routes',
    '/api/routes/distance',
    '/api/rider-routes/search'
  ],
  POST: []
};

function isPublicRideRoute(method, path) {
  return PUBLIC_RIDE_ROUTES[method]?.includes(path) || false;
}

module.exports = {
  PUBLIC_RIDE_ROUTES,
  isPublicRideRoute
};
