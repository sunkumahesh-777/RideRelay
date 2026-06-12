const PUBLIC_USER_ROUTES = {
  GET: [],
  POST: ['/api/auth/signup', '/api/auth/login']
};

function isPublicUserRoute(method, path) {
  return PUBLIC_USER_ROUTES[method]?.includes(path) || false;
}

module.exports = {
  PUBLIC_USER_ROUTES,
  isPublicUserRoute
};
